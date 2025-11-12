# Changelog

## [0.25.0](https://github.com/axiomhq/ai/compare/axiom-v0.24.0...axiom-v0.25.0) (2025-11-11)


### Features

* add `--list` flag ([#116](https://github.com/axiomhq/ai/issues/116)) ([4f303cf](https://github.com/axiomhq/ai/commit/4f303cf6029e67ff766b3f47da732dc10de25244))

## [0.24.0](https://github.com/axiomhq/ai/compare/axiom-v0.23.0...axiom-v0.24.0) (2025-11-06)


### Features

* **evals:** add runId to evaluation payload and reporting ([#105](https://github.com/axiomhq/ai/issues/105)) ([18518b2](https://github.com/axiomhq/ai/commit/18518b27dd499694f9207844f59f91b41cfbfa4d))


### Bug Fixes

* CLI doesn't show any warnings if it fails to register evaluation ([#111](https://github.com/axiomhq/ai/issues/111)) ([68a712d](https://github.com/axiomhq/ai/commit/68a712dbe5e83a70e2e2c00a8f19419776bb45fa))

## [0.23.0](https://github.com/axiomhq/ai/compare/axiom-v0.22.2...axiom-v0.23.0) (2025-11-04)


### Features

* better scorers ([#106](https://github.com/axiomhq/ai/issues/106)) ([cb95b46](https://github.com/axiomhq/ai/commit/cb95b4609dcbd6c706897664e885661b392fe66d))
* default name for chat span should be `chat`, not `gen_ai.call_llm` ([#108](https://github.com/axiomhq/ai/issues/108)) ([ad560d0](https://github.com/axiomhq/ai/commit/ad560d07442e587d41f162d19f058b2cdca88b7b))
* **evaluations:** add evaluation API reporting ([#91](https://github.com/axiomhq/ai/issues/91)) ([e50e125](https://github.com/axiomhq/ai/commit/e50e1254f6f4cdba3e0c9c0e0837358ed7ec7961))


### Bug Fixes

* incorrect default shown for flag overrides ([#107](https://github.com/axiomhq/ai/issues/107)) ([ebd539d](https://github.com/axiomhq/ai/commit/ebd539d16527d376be234e2c24d220a54a152347))
* missing task spans when eval errors ([#110](https://github.com/axiomhq/ai/issues/110)) ([6787829](https://github.com/axiomhq/ai/commit/6787829d079d6a26851dd88ebb5b8af472b816a1))

## [0.22.2](https://github.com/axiomhq/ai/compare/axiom-v0.22.1...axiom-v0.22.2) (2025-10-22)


### Bug Fixes

* users application spans are using cli instrumentation ([#103](https://github.com/axiomhq/ai/issues/103)) ([d9ed0de](https://github.com/axiomhq/ai/commit/d9ed0deb5b400726bfcfc57bb7a0175ec9dea548))

## [0.22.1](https://github.com/axiomhq/ai/compare/axiom-v0.22.0...axiom-v0.22.1) (2025-10-13)


### Bug Fixes

* **cli:** externalize c12 to resolve "Dynamic require of 'os'" error in eval command ([#100](https://github.com/axiomhq/ai/issues/100)) ([07100a2](https://github.com/axiomhq/ai/commit/07100a29e1485ece5dcbb2306141f866ceaabf30))

## [0.22.0](https://github.com/axiomhq/ai/compare/axiom-v0.21.0...axiom-v0.22.0) (2025-10-10)


### Features

* `axiom.config.ts` ([#98](https://github.com/axiomhq/ai/issues/98)) ([f70239b](https://github.com/axiomhq/ai/commit/f70239bcb875048e15504a673550b88c707d6cdb))

## [0.21.0](https://github.com/axiomhq/ai/compare/axiom-v0.20.0...axiom-v0.21.0) (2025-10-06)


### Features

* better eval reporting ([#93](https://github.com/axiomhq/ai/issues/93)) ([190fd6b](https://github.com/axiomhq/ai/commit/190fd6b6fb3f2c129c593a1600953db659bc01e2))
* debug mode ([#90](https://github.com/axiomhq/ai/issues/90)) ([1ce1df8](https://github.com/axiomhq/ai/commit/1ce1df82cb8c4f51b82441119d210725a74f77d4))
* make full schema defaults required, simplify `flag` ([#96](https://github.com/axiomhq/ai/issues/96)) ([96830f3](https://github.com/axiomhq/ai/commit/96830f300bc63d90b35b4028c5e1533f501bcbaa))
* update otel setup ([#94](https://github.com/axiomhq/ai/issues/94)) ([5b4ae1f](https://github.com/axiomhq/ai/commit/5b4ae1ff0bbc0aaa2d495df736c3a471861e943b))


### Bug Fixes

* `chat <model> stream` span has `gen_ai.operation.name`, which it should not ([#97](https://github.com/axiomhq/ai/issues/97)) ([b768ffc](https://github.com/axiomhq/ai/commit/b768ffc57d992e998caac7de040ea4749350ae7c))

## [0.20.0](https://github.com/axiomhq/ai/compare/axiom-v0.19.0...axiom-v0.20.0) (2025-09-25)


### Features

* `gen_ai.provider.name` for ai gateway ([#89](https://github.com/axiomhq/ai/issues/89)) ([5f9d804](https://github.com/axiomhq/ai/commit/5f9d8043f92e4f758f0890f7ec85dbcf03d0ab4d))


### Bug Fixes

* environment variables don't load in findEvaluationCases ([#87](https://github.com/axiomhq/ai/issues/87)) ([59f7e95](https://github.com/axiomhq/ai/commit/59f7e95952ebc8cfae0e354223371a964093f256))

## [0.19.0](https://github.com/axiomhq/ai/compare/axiom-v0.18.0...axiom-v0.19.0) (2025-09-23)


### Features

* eval flags ([#78](https://github.com/axiomhq/ai/issues/78)) ([a6a315e](https://github.com/axiomhq/ai/commit/a6a315e0be902d88bc30e6618b162fc48190cf7f))


### Bug Fixes

* don't print report for skipped test suites ([#85](https://github.com/axiomhq/ai/issues/85)) ([dfb11f9](https://github.com/axiomhq/ai/commit/dfb11f9ab1ba1f8e0556a7a5814aa51ebf93087a))
* **format:** fix format errors ([#81](https://github.com/axiomhq/ai/issues/81)) ([602aee5](https://github.com/axiomhq/ai/commit/602aee53175c2db7d11f7f5b8bbdd01ccf74333a))

## [0.18.0](https://github.com/axiomhq/ai/compare/axiom-v0.17.0...axiom-v0.18.0) (2025-09-12)


### Features

* use semantic-conventions 1.37 package ([#74](https://github.com/axiomhq/ai/issues/74)) ([7de66b0](https://github.com/axiomhq/ai/commit/7de66b03a2a162e6ecc86ed476453f6eca0f722d))

## [0.17.0](https://github.com/axiomhq/ai/compare/axiom-v0.16.0...axiom-v0.17.0) (2025-09-04)


### Features

* put capability and step name on tool calls ([#71](https://github.com/axiomhq/ai/issues/71)) ([8b9a06e](https://github.com/axiomhq/ai/commit/8b9a06e8f5fa791d0616da3c0b95e522d3feebf3))

## [0.16.0](https://github.com/axiomhq/ai/compare/axiom-v0.15.0...axiom-v0.16.0) (2025-09-03)


### Features

* match more providers ([#66](https://github.com/axiomhq/ai/issues/66)) ([4ea1498](https://github.com/axiomhq/ai/commit/4ea14989f80c8ec9b963e34c8be694d643228bfc))


### Bug Fixes

* **evals:** fix path resolution ([#68](https://github.com/axiomhq/ai/issues/68)) ([f7eedfe](https://github.com/axiomhq/ai/commit/f7eedfe226432275436d2f3d89ee2752fb6cc5ef))

## [0.15.0](https://github.com/axiomhq/ai/compare/axiom-v0.14.0...axiom-v0.15.0) (2025-08-29)


### Features

* use semconv 1.37, add redaction options ([#63](https://github.com/axiomhq/ai/issues/63)) ([baec814](https://github.com/axiomhq/ai/commit/baec814311d2a3e97ad1edb4c8ba3b661208720e))

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
