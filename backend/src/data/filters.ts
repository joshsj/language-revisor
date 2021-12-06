import {
  Word,
  NounOptions,
  VerbOptions,
  ChallengeOptions,
} from "@/common/entities";

// TODO: this is nasty tbf

const toWordTypeFilter = <T extends Word>(
  type: T["type"],
  options: { [K in keyof T]?: unknown } = {}
) => ({ type, ...options });
type WordTypeFilter = ReturnType<typeof toWordTypeFilter>;

const nounFilter = ({}: NounOptions): WordTypeFilter =>
  toWordTypeFilter("noun");

const verbFilter = ({ regular, irregular }: VerbOptions): WordTypeFilter => {
  const regulars = [];

  regular && regulars.push(true);
  irregular && regulars.push(false);

  return toWordTypeFilter("verb", {
    regular: { $in: regulars },
  });
};

const challengeOptions = ({ noun, verb }: ChallengeOptions) => {
  const typeFilters: WordTypeFilter[] = [];

  noun && typeFilters.push(nounFilter(noun));
  verb && typeFilters.push(verbFilter(verb));

  return typeFilters.length ? { $or: typeFilters } : {};
};

export { challengeOptions };
