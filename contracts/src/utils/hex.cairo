use untitled::models::{Direction, Vec2};

/// Get neighbor hex in axial coordinates (pointy-top orientation)
/// Axial system: q (x-axis), r (y-axis)
/// No even/odd row logic needed!
pub fn get_neighbor(position: Vec2, direction: Direction) -> Vec2 {
    let q = position.x;
    let r = position.y;

    match direction {
        Direction::East =>      Vec2 { x: q + 1, y: r },      // (+1,  0)
        Direction::NorthEast => Vec2 { x: q + 1, y: r - 1 },  // (+1, -1)
        Direction::NorthWest => Vec2 { x: q,     y: r - 1 },  // ( 0, -1)
        Direction::West =>      Vec2 { x: q - 1, y: r },      // (-1,  0)
        Direction::SouthWest => Vec2 { x: q - 1, y: r + 1 },  // (-1, +1)
        Direction::SouthEast => Vec2 { x: q,     y: r + 1 },  // ( 0, +1)
    }
}

/// Check if hex is within 10x10 grid bounds
/// Note: Axial coordinates can have negative values for some hexes
/// We need to define bounds based on game design
pub fn is_within_bounds(position: Vec2) -> bool {
    // Simple rectangular bounding for 10x10 hex grid
    // This allows hexes where 0 <= q < 10 and 0 <= r < 10
    position.x < 10 && position.y < 10
}

// Note: axial_to_cube commented out for future use
// Cairo doesn't support signed integers in the same way
// Will implement when needed for distance calculations
