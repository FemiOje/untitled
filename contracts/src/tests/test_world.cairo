#[cfg(test)]
mod tests {
    use dojo::model::{ModelStorage, ModelStorageTest};
    use dojo::world::{WorldStorageTrait, world};
    use dojo_cairo_test::{
        ContractDef, ContractDefTrait, NamespaceDef, TestResource, WorldStorageTestTrait,
        spawn_test_world,
    };
    use untitled::models::{Direction, Moves, Position, Vec2, m_Moves, m_Position};
    use untitled::systems::actions::{IActionsDispatcher, IActionsDispatcherTrait, actions};
    use untitled::utils::hex::{get_neighbor, is_within_bounds};
    use starknet::{ContractAddress, testing};

    fn namespace_def() -> NamespaceDef {
        let ndef = NamespaceDef {
            namespace: "untitled",
            resources: [
                TestResource::Model(m_Position::TEST_CLASS_HASH),
                TestResource::Model(m_Moves::TEST_CLASS_HASH),
                TestResource::Event(actions::e_Spawned::TEST_CLASS_HASH),
                TestResource::Event(actions::e_Moved::TEST_CLASS_HASH),
                TestResource::Contract(actions::TEST_CLASS_HASH),
            ]
                .span(),
        };

        ndef
    }

    fn contract_defs() -> Span<ContractDef> {
        [
            ContractDefTrait::new(@"untitled", @"actions")
                .with_writer_of([dojo::utils::bytearray_hash(@"untitled")].span())
        ]
            .span()
    }

    #[test]
    fn test_world_test_set() {
        // Initialize test environment
        let caller: ContractAddress = 0.try_into().unwrap();
        let ndef = namespace_def();

        // Register the resources.
        let mut world = spawn_test_world(world::TEST_CLASS_HASH, [ndef].span());

        // Ensures permissions and initializations are synced.
        world.sync_perms_and_inits(contract_defs());

        // Test initial position
        let mut position: Position = world.read_model(caller);
        assert(position.vec.x == 0 && position.vec.y == 0, 'initial position wrong');

        // Test write_model_test
        position.vec.x = 122;
        position.vec.y = 88;

        world.write_model_test(@position);

        let mut position: Position = world.read_model(caller);
        assert(position.vec.y == 88, 'write_value_from_id failed');

        // Test model deletion
        world.erase_model(@position);
        let position: Position = world.read_model(caller);
        assert(position.vec.x == 0 && position.vec.y == 0, 'erase_model failed');
    }

    // Test hex movement utility functions
    #[test]
    fn test_hex_movement_east() {
        let pos = Vec2 { x: 5, y: 5 };
        let next = get_neighbor(pos, Direction::East);
        assert(next.x == 6, 'East q failed');
        assert(next.y == 5, 'East r failed');
    }

    #[test]
    fn test_hex_movement_northeast() {
        let pos = Vec2 { x: 5, y: 5 };
        let next = get_neighbor(pos, Direction::NorthEast);
        assert(next.x == 6, 'NE q failed');
        assert(next.y == 4, 'NE r failed');
    }

    #[test]
    fn test_hex_movement_northwest() {
        let pos = Vec2 { x: 5, y: 5 };
        let next = get_neighbor(pos, Direction::NorthWest);
        assert(next.x == 5, 'NW q failed');
        assert(next.y == 4, 'NW r failed');
    }

    #[test]
    fn test_hex_movement_west() {
        let pos = Vec2 { x: 5, y: 5 };
        let next = get_neighbor(pos, Direction::West);
        assert(next.x == 4, 'West q failed');
        assert(next.y == 5, 'West r failed');
    }

    #[test]
    fn test_hex_movement_southwest() {
        let pos = Vec2 { x: 5, y: 5 };
        let next = get_neighbor(pos, Direction::SouthWest);
        assert(next.x == 4, 'SW q failed');
        assert(next.y == 6, 'SW r failed');
    }

    #[test]
    fn test_hex_movement_southeast() {
        let pos = Vec2 { x: 5, y: 5 };
        let next = get_neighbor(pos, Direction::SouthEast);
        assert(next.x == 5, 'SE q failed');
        assert(next.y == 6, 'SE r failed');
    }

    #[test]
    fn test_boundary_validation() {
        assert(is_within_bounds(Vec2 { x: 0, y: 0 }), 'Origin failed');
        assert(is_within_bounds(Vec2 { x: 9, y: 9 }), 'Max corner failed');
        assert(!is_within_bounds(Vec2 { x: 10, y: 5 }), 'Out q failed');
        assert(!is_within_bounds(Vec2 { x: 5, y: 10 }), 'Out r failed');
    }

    #[test]
    #[available_gas(30000000)]
    fn test_spawn() {
        let caller: ContractAddress = 0.try_into().unwrap();

        let ndef = namespace_def();
        let mut world = spawn_test_world(world::TEST_CLASS_HASH, [ndef].span());
        world.sync_perms_and_inits(contract_defs());

        let (contract_address, _) = world.dns(@"actions").unwrap();
        let actions_system = IActionsDispatcher { contract_address };

        actions_system.spawn();

        // Verify position is within bounds (random spawn)
        let position: Position = world.read_model(caller);
        assert(is_within_bounds(position.vec), 'Spawn out of bounds');
        assert(position.vec.x < 10, 'X coord out of range');
        assert(position.vec.y < 10, 'Y coord out of range');

        // Verify moves are initialized correctly
        let moves: Moves = world.read_model(caller);
        assert(moves.can_move, 'Cannot move');
        assert(moves.last_direction.is_none(), 'Last direction should be None');
    }

    #[test]
    #[available_gas(30000000)]
    fn test_spawn_randomness() {
        // Test that spawn positions can vary based on player address
        // Note: In a deterministic test environment with same block,
        // different player addresses should produce different positions
        let caller1: ContractAddress = 1.try_into().unwrap();
        let caller2: ContractAddress = 2.try_into().unwrap();

        let ndef = namespace_def();
        let mut world = spawn_test_world(world::TEST_CLASS_HASH, [ndef].span());
        world.sync_perms_and_inits(contract_defs());

        let (contract_address, _) = world.dns(@"actions").unwrap();
        let actions_system = IActionsDispatcher { contract_address };

        // Spawn first player
        starknet::testing::set_contract_address(caller1);
        actions_system.spawn();
        let position1: Position = world.read_model(caller1);

        // Spawn second player
        starknet::testing::set_contract_address(caller2);
        actions_system.spawn();
        let position2: Position = world.read_model(caller2);

        // Both positions should be valid
        assert(is_within_bounds(position1.vec), 'Player 1 out of bounds');
        assert(is_within_bounds(position2.vec), 'Player 2 out of bounds');

        // Positions should differ (due to different player addresses in seed)
        let same_position = position1.vec.x == position2.vec.x && position1.vec.y == position2.vec.y;
        assert(!same_position, 'Positions should differ');
    }

    #[test]
    #[available_gas(30000000)]
    fn test_move_east() {
        let caller: ContractAddress = 0.try_into().unwrap();

        let ndef = namespace_def();
        let mut world = spawn_test_world(world::TEST_CLASS_HASH, [ndef].span());
        world.sync_perms_and_inits(contract_defs());

        let (contract_address, _) = world.dns(@"actions").unwrap();
        let actions_system = IActionsDispatcher { contract_address };

        actions_system.spawn();
        let initial_position: Position = world.read_model(caller);

        actions_system.move(Direction::East);

        let moves: Moves = world.read_model(caller);
        let east_dir_felt: felt252 = Direction::East.into();

        assert(moves.last_direction.unwrap().into() == east_dir_felt, 'last direction is wrong');

        let new_position: Position = world.read_model(caller);
        assert(new_position.vec.x == initial_position.vec.x + 1, 'position q is wrong');
        assert(new_position.vec.y == initial_position.vec.y, 'position r is wrong');
    }

    #[test]
    #[available_gas(30000000)]
    fn test_move_northeast() {
        let caller: ContractAddress = 0.try_into().unwrap();

        let ndef = namespace_def();
        let mut world = spawn_test_world(world::TEST_CLASS_HASH, [ndef].span());
        world.sync_perms_and_inits(contract_defs());

        let (contract_address, _) = world.dns(@"actions").unwrap();
        let actions_system = IActionsDispatcher { contract_address };

        actions_system.spawn();
        let initial_position: Position = world.read_model(caller);

        actions_system.move(Direction::NorthEast);

        let new_position: Position = world.read_model(caller);
        assert(new_position.vec.x == initial_position.vec.x + 1, 'position q is wrong');
        assert(new_position.vec.y == initial_position.vec.y - 1, 'position r is wrong');
    }

    #[test]
    #[available_gas(30000000)]
    #[should_panic(expected: ('Move out of bounds', 'ENTRYPOINT_FAILED'))]
    fn test_move_out_of_bounds() {
        let caller: ContractAddress = 0.try_into().unwrap();

        let ndef = namespace_def();
        let mut world = spawn_test_world(world::TEST_CLASS_HASH, [ndef].span());
        world.sync_perms_and_inits(contract_defs());

        let (contract_address, _) = world.dns(@"actions").unwrap();
        let actions_system = IActionsDispatcher { contract_address };

        let edge_position = Position {
            player: caller,
            vec: Vec2 { x: 9, y: 5 }
        };
        world.write_model_test(@edge_position);

        let moves = Moves {
            player: caller,
            last_direction: Option::None,
            can_move: true,
        };
        world.write_model_test(@moves);

        actions_system.move(Direction::East);
    }

}
