import { JSONSchema4 } from "json-schema"
import { Rule } from "eslint"

/** Input to createRule */
export interface RuleDescription {
  /** Description of the eslint rule */
  description: string

  /** Messages that can be reported by the rule */
  messages?: Rule.RuleMetaData["messages"]

  /** Additional property settings the rule understands */
  addlProps?: { [key: string]: JSONSchema4 }

  /** The rule's create function */
  create(context: Rule.RuleContext): Rule.RuleListener
}

/**
 * Create the skeleton of an eslint rule
 * @returns an eslint rule
 */
export const createRule = ({
  description,
  messages,
  addlProps,
  create,
}: RuleDescription): Rule.RuleModule => ({
  meta: {
    docs: {
      description,
      recommended: true,
    },
    messages,
    schema: [
      {
        type: "object",
        properties: {
          baseDir: {
            description: "Base directory for resolving 'absolute' imports",
            type: "string",
          },
          camelCase: {
            description:
              "How classes are exported. See the documentation for css-loader: https://github.com/webpack-contrib/css-loader/tree/v2.1.1#camelcase",
            oneOf: [
              { type: "boolean" },
              {
                enum: [
                  "asIs",
                  "camelCase",
                  "camelCaseOnly",
                  "dashes",
                  "dashesOnly",
                  "only",
                ],
              },
            ],
          },
          defaultScope: {
            description:
              "The default scope of classes that are not explicitly scoped: local, global, or pure... I'm not sure what pure is; it's not documented.",
            enum: ["local", "global", "pure"],
          },
          include: {
            description: "Anymatch describing what files to parse.",
            type: "any",
          },
          exclude: {
            description:
              "Anymatch describing what files to exclude from parsing.",
            type: "any",
          },
          ...addlProps,
        },
        additionalProperties: false,
      },
    ],
  },
  create,
})
