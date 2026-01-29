use starknet::ContractAddress;

#[derive(Copy, Drop, Serde, Debug)]
#[dojo::model]
pub struct Moves {
    #[key]
    pub player: ContractAddress,
    pub last_direction: Option<Direction>,
    pub can_move: bool,
}

#[derive(Drop, Serde, Debug)]
#[dojo::model]
pub struct DirectionsAvailable {
    #[key]
    pub player: ContractAddress,
    pub directions: Array<Direction>,
}

#[derive(Copy, Drop, Serde, Debug)]
#[dojo::model]
pub struct Position {
    #[key]
    pub player: ContractAddress,
    pub vec: Vec2,
}

#[derive(Copy, Drop, Serde, Debug)]
#[dojo::model]
pub struct PositionCount {
    #[key]
    pub identity: ContractAddress,
    pub position: Span<(u8, u128)>,
}

#[derive(Serde, Copy, Drop, Introspect, PartialEq, Debug, DojoStore, Default)]
pub enum Direction {
    #[default]
    East,       // E:  (+1,  0)
    NorthEast,  // NE: (+1, -1)
    NorthWest,  // NW: ( 0, -1)
    West,       // W:  (-1,  0)
    SouthWest,  // SW: (-1, +1)
    SouthEast,  // SE: ( 0, +1)
}

#[derive(Copy, Drop, Serde, IntrospectPacked, Debug, DojoStore)]
pub struct Vec2 {
    pub x: u32,
    pub y: u32,
}


impl DirectionIntoFelt252 of Into<Direction, felt252> {
    fn into(self: Direction) -> felt252 {
        match self {
            Direction::East => 1,
            Direction::NorthEast => 2,
            Direction::NorthWest => 3,
            Direction::West => 4,
            Direction::SouthWest => 5,
            Direction::SouthEast => 6,
        }
    }
}

impl OptionDirectionIntoFelt252 of Into<Option<Direction>, felt252> {
    fn into(self: Option<Direction>) -> felt252 {
        match self {
            Option::None => 0,
            Option::Some(d) => d.into(),
        }
    }
}

#[generate_trait]
impl Vec2Impl of Vec2Trait {
    fn is_zero(self: Vec2) -> bool {
        if self.x - self.y == 0 {
            return true;
        }
        false
    }

    fn is_equal(self: Vec2, b: Vec2) -> bool {
        self.x == b.x && self.y == b.y
    }
}

#[cfg(test)]
mod tests {
    use super::{Vec2, Vec2Trait};

    #[test]
    fn test_vec_is_zero() {
        assert(Vec2Trait::is_zero(Vec2 { x: 0, y: 0 }), 'not zero');
    }

    #[test]
    fn test_vec_is_equal() {
        let position = Vec2 { x: 420, y: 0 };
        assert(position.is_equal(Vec2 { x: 420, y: 0 }), 'not equal');
    }
}
