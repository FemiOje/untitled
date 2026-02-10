use untitled::models::{Direction, Position};

// define the interface
#[starknet::interface]
pub trait IActions<T> {
    fn spawn(ref self: T);
    fn move(ref self: T, direction: Direction);
}

// dojo decorator
#[dojo::contract]
pub mod actions {
    use dojo::event::EventStorage;
    use dojo::model::ModelStorage;
    use untitled::models::{Moves, Vec2};
    use untitled::utils::hex::{get_neighbor, is_within_bounds};
    use starknet::{ContractAddress, get_caller_address, get_tx_info, get_block_timestamp};
    use super::{Direction, IActions, Position};

    #[derive(Copy, Drop, Serde)]
    #[dojo::event]
    pub struct Spawned {
        #[key]
        pub player: ContractAddress,
        pub position: Vec2,
    }

    #[derive(Copy, Drop, Serde)]
    #[dojo::event]
    pub struct Moved {
        #[key]
        pub player: ContractAddress,
        pub direction: Direction,
        pub position: Vec2,
    }

    #[abi(embed_v0)]
    impl ActionsImpl of IActions<ContractState> {
        fn spawn(ref self: ContractState) {
            let mut world = self.world_default();

            let player = get_caller_address();

            // Currently using block timestamp + tx hash for randomness
            // TODO: Switch to VRF for prod
            let tx_info = get_tx_info().unbox();
            let timestamp = get_block_timestamp();

            // Combine entropy sources and derive coordinates
            let seed: felt252 = timestamp.into() + tx_info.transaction_hash + player.into();
            let seed_u256: u256 = seed.into();
            let x_u32: u32 = (seed_u256 % 10).try_into().unwrap();
            let y_u32: u32 = ((seed_u256 / 10) % 10).try_into().unwrap();
            let x: i32 = x_u32.try_into().unwrap();
            let y: i32 = y_u32.try_into().unwrap();

            let new_position = Position {
                player, vec: Vec2 { x, y },
            };

            world.write_model(@new_position);

            // Initialize moves
            let moves = Moves {
                player,
                last_direction: Option::None,
                can_move: true,
            };
            world.write_model(@moves);

            // Emit spawn event with position
            world.emit_event(@Spawned { player, position: new_position.vec });
        }

        fn move(ref self: ContractState, direction: Direction) {
            let mut world = self.world_default();
            let player = get_caller_address();

            // Retrieve the player's current position and moves data from the world.
            let position: Position = world.read_model(player);
            let mut moves: Moves = world.read_model(player);
            
            assert(moves.can_move, 'cannot move');

            // Calculate next position using hex math
            let next_vec = get_neighbor(position.vec, direction);

            // Validate bounds
            assert(is_within_bounds(next_vec), 'Move is out of bounds');

            // Update position
            let next = Position { player, vec: next_vec };
            world.write_model(@next);

            // Update moves
            moves.last_direction = Option::Some(direction);
            world.write_model(@moves);

            // Emit event
            world.emit_event(@Moved { player, direction, position: next_vec });
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn world_default(self: @ContractState) -> dojo::world::WorldStorage {
            self.world(@"untitled")
        }
    }
}
