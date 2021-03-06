import { Container } from "@/common/dependency/container";
import { ChallengeOptions, Word } from "@/common/entities";
import { guard } from "@/common/utilities/guard";
import { Entity } from "../data/entities";
import { Words } from "../data/models";
import { id } from "../data/utilities";
import { Dependencies, MessageHandlers } from "../dependency";
import { toEverythingChallenge, toActiveChallenge, toChallenge } from "./converters";
import * as wordQuery from "./queries/word";

const getRandomWord = async (words: Words, options: ChallengeOptions): Promise<Word | undefined> =>
  (await words.aggregate([{ $match: wordQuery.fromChallengeOptions(options) }, { $sample: { size: 1 } }]))[0];

const createHandlers = (container: Container<Dependencies>): MessageHandlers => ({
  newChallenge: async ({ message }, session) => {
    const { models } = guard.required(
      { models: container.resolve("models") },
      (missing) => `Missing required dependencies: ${missing.join(", ")}`
    );

    const { word } = guard.required({ word: await getRandomWord(models.words, message) }, "No words found");

    const everything = toEverythingChallenge(word, session);
    await models.activeChallenges.create(toActiveChallenge(everything));

    return {
      name: "newChallenge",
      message: toChallenge(everything),
    };
  },

  attempt: async ({ message: { challengeId, attempt } }) => {
    const { models, answerChecker } = guard.required(
      {
        models: container.resolve("models"),
        answerChecker: container.resolve("answerChecker"),
      },
      (missing) => `Missing required dependencies: ${missing.join(", ")}`
    );

    const { activeChallenge } = guard.required(
      {
        activeChallenge: await models.activeChallenges.findOne({
          _id: challengeId,
        }),
      },
      `No ActiveChallenge was found with ChallengeId: ${challengeId}`
    );

    const status = answerChecker(activeChallenge.answer, attempt);

    status === "correct" && (await models.activeChallenges.findByIdAndDelete(challengeId));

    return { name: "attempt", message: { result: status } };
  },

  createWord: async ({ message: word }) => {
    const { models } = guard.required({ models: container.resolve("models") }, "Missing dependency: models");

    const entity: Entity<Word> = { ...word, _id: id() };

    models.words.create(entity);
  },

  skip: async ({ message: { challengeId } }) => {
    const { models } = guard.required({ models: container.resolve("models") }, "Missing dependency: models");

    const { activeChallenge } = guard.required(
      {
        activeChallenge: await models.activeChallenges.findByIdAndDelete(challengeId),
      },
      `No ActiveChallenge was found with ChallengeId: ${challengeId}`
    );

    return { name: "skip", message: { answer: activeChallenge.answer } };
  },
});

export { createHandlers };
