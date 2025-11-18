type ValidChars =
  | 'a'
  | 'b'
  | 'c'
  | 'd'
  | 'e'
  | 'f'
  | 'g'
  | 'h'
  | 'i'
  | 'j'
  | 'k'
  | 'l'
  | 'm'
  | 'n'
  | 'o'
  | 'p'
  | 'q'
  | 'r'
  | 's'
  | 't'
  | 'u'
  | 'v'
  | 'w'
  | 'x'
  | 'y'
  | 'z'
  | 'A'
  | 'B'
  | 'C'
  | 'D'
  | 'E'
  | 'F'
  | 'G'
  | 'H'
  | 'I'
  | 'J'
  | 'K'
  | 'L'
  | 'M'
  | 'N'
  | 'O'
  | 'P'
  | 'Q'
  | 'R'
  | 'S'
  | 'T'
  | 'U'
  | 'V'
  | 'W'
  | 'X'
  | 'Y'
  | 'Z'
  | '0'
  | '1'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | '-'
  | '_';

export type IsValid<T extends string> = ValidateName<T> extends T ? T : never;
export type IsInvalid<T extends string> = ValidateName<T> extends T ? never : T;
export type Err<M extends string> = never & { __error__: M };

export type ValidateName<T extends string, Original extends string = T> =
  // For widened strings, don't attempt validation – let them flow through unchanged
  string extends T // string is not wider than T, ie T is string
    ? T
    : T extends ''
      ? Original extends ''
        ? '❌ Name cannot be empty'
        : Original
      : T extends `${infer First}${infer Rest}`
        ? First extends ValidChars
          ? ValidateName<Rest, Original>
          : `❌ Invalid character in "${Original}". Only A-Z, a-z, 0-9, -, _ allowed`
        : never;
