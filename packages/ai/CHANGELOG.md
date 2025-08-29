# Changelog

## [0.14.0](https://github.com/axiomhq/ai/compare/axiom-v0.13.0...axiom-v0.14.0) (2025-08-28)


### Features

* **evals:** pass model name & params to eval task ([#62](https://github.com/axiomhq/ai/issues/62)) ([bc6f9bf](https://github.com/axiomhq/ai/commit/bc6f9bfb93c8311414e60ddd3dd822e726798257))

## [0.13.0](https://github.com/axiomhq/ai/compare/axiom-v0.12.0...axiom-v0.13.0) (2025-08-20)


### Features

* **evals:** user custom names for cases ([#60](https://github.com/axiomhq/ai/issues/60)) ([e868ad6](https://github.com/axiomhq/ai/commit/e868ad6156f36ebca1e9ffd1aa69f58e47772ec8))

## [0.12.0](https://github.com/axiomhq/ai/compare/axiom-v0.11.2...axiom-v0.12.0) (2025-08-17)


### Features

* better stream handling ([#57](https://github.com/axiomhq/ai/issues/57)) ([68c5a4d](https://github.com/axiomhq/ai/commit/68c5a4df3cbc1c30ad858817e8592d8a275c4014))

## [0.11.2](https://github.com/axiomhq/ai/compare/axiom-v0.11.1...axiom-v0.11.2) (2025-08-15)


### Features

* **evals:** send score errors and tighten the scorer type ([#55](https://github.com/axiomhq/ai/issues/55)) ([85044f5](https://github.com/axiomhq/ai/commit/85044f529eefe4a767cbb82780dcc3ed869e4723))

## [0.11.1](https://github.com/axiomhq/ai/compare/axiom-v0.11.0...axiom-v0.11.1) (2025-08-15)


### Features

* **evals:** attach user info to eval span ([#53](https://github.com/axiomhq/ai/issues/53)) ([449674e](https://github.com/axiomhq/ai/commit/449674e3a89ca8f0672b0cdbf0e40ab1f1cd1c2a))

## [0.11.0](https://github.com/axiomhq/ai/compare/axiom-v0.10.0...axiom-v0.11.0) (2025-08-14)


### ⚠ BREAKING CHANGES

* change cli run command to eval [#49]
* print summary table after eval runs [#49]

## [0.10.0](https://github.com/axiomhq/ai/compare/axiom-v0.8.0...axiom-v0.10.0) (2025-08-11)


### ⚠ BREAKING CHANGES

* update package name ([#43](https://github.com/axiomhq/ai/issues/43))

### Features

* add cjs output ([#25](https://github.com/axiomhq/ai/issues/25)) ([7780d1a](https://github.com/axiomhq/ai/commit/7780d1a9631054969522a20a16f8f327d2954ebc))
* add prompts and evals as experimental_ features to ai package ([#32](https://github.com/axiomhq/ai/issues/32)) ([e385507](https://github.com/axiomhq/ai/commit/e385507e98472ac62ad98c7545164184ab592868))
* create withSpan and ai wrapper ([fd261d9](https://github.com/axiomhq/ai/commit/fd261d97571e281b59dcab6d52b19162d0c757cd))
* **evals:** register evals at Axiom ([#41](https://github.com/axiomhq/ai/issues/41)) ([5e7c8a4](https://github.com/axiomhq/ai/commit/5e7c8a4f3f94a897cd2ee7d3e7f91b80c3cb5855))
* instrument tool calls, simplify schema, increase test coverage, add examples, a lot of refactoring ([#10](https://github.com/axiomhq/ai/issues/10)) ([db0b533](https://github.com/axiomhq/ai/commit/db0b533b989c2c9b84b78f4b3df00474aaae0473))
* move to middleware ([#31](https://github.com/axiomhq/ai/issues/31)) ([c30c764](https://github.com/axiomhq/ai/commit/c30c764661e347f90fb70ad6a3babd14fbe70040))
* publint ([#27](https://github.com/axiomhq/ai/issues/27)) ([6da8067](https://github.com/axiomhq/ai/commit/6da8067a2e442c5fdca7d10f734a0a0d14765912))
* setup global TracerProvider to make `initAxiomAI` pass the corr… ([#37](https://github.com/axiomhq/ai/issues/37)) ([cecb816](https://github.com/axiomhq/ai/commit/cecb8163dbf390f65030f0181109aef46e7377f1))
* support LanguageModelV2 / ai sdk v5 ([#8](https://github.com/axiomhq/ai/issues/8)) ([1dae459](https://github.com/axiomhq/ai/commit/1dae4591cdc08763bebe01fd8b55ce8bfeb99b3f))
* support vercel ai sdk v5 final ([#35](https://github.com/axiomhq/ai/issues/35)) ([45316ec](https://github.com/axiomhq/ai/commit/45316ec0f88228f5ececdba4a9c99922e65296e1))
* update package name ([#43](https://github.com/axiomhq/ai/issues/43)) ([6917ba7](https://github.com/axiomhq/ai/commit/6917ba7eb5c7c5187149360b3f1dfad923bde322))
* update span shape / semantic conventions ([#7](https://github.com/axiomhq/ai/issues/7)) ([376e5d5](https://github.com/axiomhq/ai/commit/376e5d50b6be48a44d9052b8e99e5e6547d52501))
* warn if no tracer found, add jsdoc ([#29](https://github.com/axiomhq/ai/issues/29)) ([cc9f1dc](https://github.com/axiomhq/ai/commit/cc9f1dcd1ea1298de70c332f4908c4e1dbe5686a))


### Bug Fixes

* revert 1.0.0 and release as 0.10.0 ([c1b9c4f](https://github.com/axiomhq/ai/commit/c1b9c4fadadf06349659476afd62284eb79a9a0f))
* streamText fails to send `chat` span silently with AI SDK v4 ([#20](https://github.com/axiomhq/ai/issues/20)) ([9232860](https://github.com/axiomhq/ai/commit/9232860664580a87e1e55f9b372dca31f18a8f0e))
* **test:** coverage and missing deps ([#4](https://github.com/axiomhq/ai/issues/4)) ([0b8952f](https://github.com/axiomhq/ai/commit/0b8952f095712f2b88abfd7556bff566c6716dd9))

## [0.8.0](https://github.com/axiomhq/ai/compare/ai-v0.7.0...ai-v0.8.0) (2025-08-04)


### Features

* add prompts and evals as experimental_ features to ai package ([#32](https://github.com/axiomhq/ai/issues/32)) ([e385507](https://github.com/axiomhq/ai/commit/e385507e98472ac62ad98c7545164184ab592868))

## [0.7.0](https://github.com/axiomhq/ai/compare/ai-v0.6.0...ai-v0.7.0) (2025-08-04)


### Features

* setup global TracerProvider to make `initAxiomAI` pass the corr… ([#37](https://github.com/axiomhq/ai/issues/37)) ([cecb816](https://github.com/axiomhq/ai/commit/cecb8163dbf390f65030f0181109aef46e7377f1))

## [0.6.0](https://github.com/axiomhq/ai/compare/ai-v0.5.0...ai-v0.6.0) (2025-08-01)


### Features

* support vercel ai sdk v5 final ([#35](https://github.com/axiomhq/ai/issues/35)) ([45316ec](https://github.com/axiomhq/ai/commit/45316ec0f88228f5ececdba4a9c99922e65296e1))

## [0.5.0](https://github.com/axiomhq/ai/compare/ai-v0.4.0...ai-v0.5.0) (2025-07-30)


### Features

* move to middleware ([#31](https://github.com/axiomhq/ai/issues/31)) ([c30c764](https://github.com/axiomhq/ai/commit/c30c764661e347f90fb70ad6a3babd14fbe70040))

## [0.4.0](https://github.com/axiomhq/ai/compare/ai-v0.3.0...ai-v0.4.0) (2025-07-25)


### Features

* warn if no tracer found, add jsdoc ([#29](https://github.com/axiomhq/ai/issues/29)) ([cc9f1dc](https://github.com/axiomhq/ai/commit/cc9f1dcd1ea1298de70c332f4908c4e1dbe5686a))

## [0.3.0](https://github.com/axiomhq/ai/compare/ai-v0.2.0...ai-v0.3.0) (2025-07-23)


### Features

* publint ([#27](https://github.com/axiomhq/ai/issues/27)) ([6da8067](https://github.com/axiomhq/ai/commit/6da8067a2e442c5fdca7d10f734a0a0d14765912))

## [0.2.0](https://github.com/axiomhq/ai/compare/ai-v0.1.0...ai-v0.2.0) (2025-07-23)


### Features

* add cjs output ([#25](https://github.com/axiomhq/ai/issues/25)) ([7780d1a](https://github.com/axiomhq/ai/commit/7780d1a9631054969522a20a16f8f327d2954ebc))

## [0.1.0](https://github.com/axiomhq/ai/compare/ai-v0.0.2...ai-v0.1.0) (2025-07-22)


### Features

* create withSpan and ai wrapper ([fd261d9](https://github.com/axiomhq/ai/commit/fd261d97571e281b59dcab6d52b19162d0c757cd))
* instrument tool calls, simplify schema, increase test coverage, add examples, a lot of refactoring ([#10](https://github.com/axiomhq/ai/issues/10)) ([db0b533](https://github.com/axiomhq/ai/commit/db0b533b989c2c9b84b78f4b3df00474aaae0473))
* support LanguageModelV2 / ai sdk v5 ([#8](https://github.com/axiomhq/ai/issues/8)) ([1dae459](https://github.com/axiomhq/ai/commit/1dae4591cdc08763bebe01fd8b55ce8bfeb99b3f))
* update span shape / semantic conventions ([#7](https://github.com/axiomhq/ai/issues/7)) ([376e5d5](https://github.com/axiomhq/ai/commit/376e5d50b6be48a44d9052b8e99e5e6547d52501))


### Bug Fixes

* streamText fails to send `chat` span silently with AI SDK v4 ([#20](https://github.com/axiomhq/ai/issues/20)) ([9232860](https://github.com/axiomhq/ai/commit/9232860664580a87e1e55f9b372dca31f18a8f0e))
* **test:** coverage and missing deps ([#4](https://github.com/axiomhq/ai/issues/4)) ([0b8952f](https://github.com/axiomhq/ai/commit/0b8952f095712f2b88abfd7556bff566c6716dd9))

## 0.0.1 (2025-07-17)


### Features

* create withSpan and ai wrapper ([fd261d9](https://github.com/axiomhq/ai/commit/fd261d97571e281b59dcab6d52b19162d0c757cd))
* support LanguageModelV2 / ai sdk v5 ([#8](https://github.com/axiomhq/ai/issues/8)) ([1dae459](https://github.com/axiomhq/ai/commit/1dae4591cdc08763bebe01fd8b55ce8bfeb99b3f))
* update span shape / semantic conventions ([#7](https://github.com/axiomhq/ai/issues/7)) ([376e5d5](https://github.com/axiomhq/ai/commit/376e5d50b6be48a44d9052b8e99e5e6547d52501))


### Bug Fixes

* **test:** coverage and missing deps ([#4](https://github.com/axiomhq/ai/issues/4)) ([0b8952f](https://github.com/axiomhq/ai/commit/0b8952f095712f2b88abfd7556bff566c6716dd9))

## Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.
