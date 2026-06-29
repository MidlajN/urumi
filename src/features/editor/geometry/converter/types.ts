export type CanonicalPathCommand =
    | ["M", number, number]
    | ["L", number, number]
    | [
          "C",
          number,
          number,
          number,
          number,
          number,
          number
      ]
    | ["Z"];


export type PathCommand =
    // Absolute
    | ["M", number, number]
    | ["L", number, number]
    | ["H", number]
    | ["V", number]
    | [
          "C",
          number,
          number,
          number,
          number,
          number,
          number
      ]
    | [
          "S",
          number,
          number,
          number,
          number
      ]
    | [
          "Q",
          number,
          number,
          number,
          number
      ]
    | [
          "T",
          number,
          number
      ]
    | [
          "A",
          number, // rx
          number, // ry
          number, // rotation
          number, // largeArcFlag
          number, // sweepFlag
          number, // x
          number  // y
      ]
    | ["Z"]
    // Relative
    | ["m", number, number]
    | ["l", number, number]
    | ["h", number]
    | ["v", number]
    | [
          "c",
          number,
          number,
          number,
          number,
          number,
          number
      ]
    | [
          "s",
          number,
          number,
          number,
          number
      ]
    | [
          "q",
          number,
          number,
          number,
          number
      ]
    | [
          "t",
          number,
          number
      ]
    | [
          "a",
          number,
          number,
          number,
          number,
          number,
          number,
          number
      ]
    | ["z"];

    