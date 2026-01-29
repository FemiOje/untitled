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
    use starknet::{ContractAddress, get_caller_address};
    use super::{Direction, IActions, Position};

    #[derive(Copy, Drop, Serde)]
    #[dojo::event]
    pub struct Moved {
        #[key]
        pub player: ContractAddress,
        pub direction: Direction,
    }

    #[abi(embed_v0)]
    impl ActionsImpl of IActions<ContractState> {
        fn spawn(ref self: ContractState) {
            let mut world = self.world_default();

            let player = get_caller_address();

            // Spawn player at center of 10x10 hex grid (q=5, r=5)
            let new_position = Position {
                player, vec: Vec2 { x: 5, y: 5 },
            };

            world.write_model(@new_position);

            // Initialize moves
            let moves = Moves {
                player,
                last_direction: Option::None,
                can_move: true,
            };
            world.write_model(@moves);
        }

        fn move(ref self: ContractState, direction: Direction) {
            let mut world = self.world_default();
            let player = get_caller_address();

            // Retrieve the player's current position and moves data from the world.
            let position: Position = world.read_model(player);
            let mut moves: Moves = world.read_model(player);
            
            if !moves.can_move {
                return;
            }

            // Calculate next position using hex math
            let next_vec = get_neighbor(position.vec, direction);

            // Validate bounds
            assert(is_within_bounds(next_vec), 'Move out of bounds');

            // Update position
            let next = Position { player, vec: next_vec };
            world.write_model(@next);

            // Update moves
            moves.last_direction = Option::Some(direction);
            world.write_model(@moves);

            // Emit event
            world.emit_event(@Moved { player, direction });
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn world_default(self: @ContractState) -> dojo::world::WorldStorage {
            self.world(@"untitled")
        }
    }
}
