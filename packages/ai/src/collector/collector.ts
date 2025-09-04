import { Project, ts, Node, SyntaxKind } from 'ts-morph';
import * as fs from 'fs';
import * as Path from 'path';
import type { CapabilityDefinition, StepDefinition } from '../capabilities';
import type { EvalDefinition } from '../evals/eval.types';

export interface CollectionResult {
  capabilities: CapabilityDefinition[];
  steps: StepDefinition[];
  evals: EvalDefinition[];
}

export interface CollectOptions {
  preserveExecutableFunctions?: boolean;
}

interface FileContext {
  imports: Map<string, string>; // local name -> module path
  variableDeclarations: Map<string, string>; // variable name -> source code
  filePath: string;
}

export const collect = async (
  path: string,
  options: CollectOptions = {},
): Promise<CollectionResult> => {
  const allCapabilities: CapabilityDefinition[] = [];
  const allSteps: StepDefinition[] = [];
  const allEvals: EvalDefinition[] = [];

  try {
    // Find all JS/TS files in the given path
    const files = await findFiles(path, ['.ts', '.js']);

    // Filter files that contain the target functions
    const relevantFiles: string[] = [];

    for (const filePath of files) {
      const content = fs.readFileSync(filePath, 'utf-8');
      if (containsTargetFunctions(content)) {
        relevantFiles.push(filePath);
      }
    }

    // Parse definitions from each relevant file using AST
    for (const filePath of relevantFiles) {
      try {
        const result = parseDefinitionsFromFile(filePath, options);
        allCapabilities.push(...result.capabilities);
        allSteps.push(...result.steps);
        allEvals.push(...result.evals);
      } catch (error) {
        console.warn(`Failed to parse file ${filePath}:`, error);
      }
    }
  } catch (error) {
    console.error('Error collecting definitions:', error);
  }

  return {
    capabilities: allCapabilities,
    steps: allSteps,
    evals: allEvals,
  };
};

async function findFiles(dirPath: string, extensions: string[]): Promise<string[]> {
  const files: string[] = [];

  function walkDir(currentPath: string) {
    if (!fs.existsSync(currentPath)) {
      return;
    }

    const stat = fs.statSync(currentPath);

    if (stat.isDirectory()) {
      // Skip node_modules and other common directories to avoid
      if (
        Path.basename(currentPath) === 'node_modules' ||
        Path.basename(currentPath) === '.git' ||
        Path.basename(currentPath) === 'dist' ||
        Path.basename(currentPath) === 'build'
      ) {
        return;
      }

      const entries = fs.readdirSync(currentPath);
      for (const entry of entries) {
        walkDir(Path.join(currentPath, entry));
      }
    } else if (stat.isFile()) {
      const ext = Path.extname(currentPath);
      if (extensions.includes(ext)) {
        files.push(currentPath);
      }
    }
  }

  walkDir(dirPath);
  return files;
}

function containsTargetFunctions(content: string): boolean {
  return /defineCapability|defineStep|defineEval/.test(content);
}

function parseDefinitionsFromFile(
  filePath: string,
  options: CollectOptions = {},
): CollectionResult {
  const capabilities: CapabilityDefinition[] = [];
  const steps: StepDefinition[] = [];
  const evals: EvalDefinition[] = [];

  try {
    // Create a project for parsing
    const project = new Project({
      compilerOptions: {
        target: ts.ScriptTarget.Latest,
        allowJs: true,
        skipLibCheck: true,
      },
    });

    const sourceFile = project.addSourceFileAtPath(filePath);

    // Extract imports and context if we need executable functions
    let fileContext: FileContext | undefined;
    if (options.preserveExecutableFunctions) {
      fileContext = extractFileContext(sourceFile);
    }

    // Find all function calls
    const callExpressions = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);

    for (const callExpression of callExpressions) {
      const expression = callExpression.getExpression();

      if (Node.isIdentifier(expression)) {
        const functionName = expression.getText();
        const args = callExpression.getArguments();

        if (args.length > 0 && Node.isObjectLiteralExpression(args[0])) {
          const objectLiteral = args[0];

          try {
            const parsedObject = parseObjectLiteral(
              objectLiteral,
              sourceFile.getFilePath(),
              options,
              fileContext,
            );

            switch (functionName) {
              case 'defineCapability':
                capabilities.push(parsedObject as CapabilityDefinition);
                break;
              case 'defineStep':
                steps.push(parsedObject as StepDefinition);
                break;
              case 'defineEval':
                evals.push(parsedObject as EvalDefinition);
                break;
            }
          } catch (error) {
            console.warn(`Failed to parse ${functionName} in ${filePath}:`, error);
          }
        }
      }
    }
  } catch (error) {
    console.warn(`Failed to parse file ${filePath}:`, error);
  }

  return { capabilities, steps, evals };
}

function extractFileContext(sourceFile: any): FileContext {
  const imports = new Map<string, string>();
  const variableDeclarations = new Map<string, string>();

  // Extract import declarations
  for (const importDeclaration of sourceFile.getImportDeclarations()) {
    const moduleSpecifier = importDeclaration.getModuleSpecifierValue();

    // Handle default imports
    const defaultImport = importDeclaration.getDefaultImport();
    if (defaultImport) {
      imports.set(defaultImport.getText(), moduleSpecifier);
    }

    // Handle named imports
    for (const namedImport of importDeclaration.getNamedImports()) {
      const name = namedImport.getName();
      const alias = namedImport.getAliasNode();
      const localName = alias ? alias.getText() : name;
      imports.set(localName, moduleSpecifier);
    }

    // Handle namespace imports
    const namespaceImport = importDeclaration.getNamespaceImport();
    if (namespaceImport) {
      imports.set(namespaceImport.getText(), moduleSpecifier);
    }
  }

  // Extract variable declarations
  for (const variableStatement of sourceFile.getVariableStatements()) {
    for (const declaration of variableStatement.getDeclarations()) {
      const name = declaration.getName();
      const initializer = declaration.getInitializer();
      if (initializer) {
        variableDeclarations.set(name, initializer.getText());
      }
    }
  }

  return {
    imports,
    variableDeclarations,
    filePath: sourceFile.getFilePath(),
  };
}

function createContextualFunction(functionNode: Node, fileContext: FileContext): Function {
  const functionSource = functionNode.getText();
  const isAsync = Node.isArrowFunction(functionNode)
    ? functionNode.isAsync()
    : Node.isFunctionExpression(functionNode)
      ? functionNode.isAsync()
      : false;

  // For now, return a wrapper function that provides an error message about missing context
  // In a production implementation, you might want to actually import the dependencies
  const contextualFunction = isAsync
    ? async function (...args: any[]) {
        console.warn(`Function called with args:`, args);
        throw new Error(
          `Function requires context from imports: ${Array.from(fileContext.imports.keys()).join(', ')}. Consider using metadata mode instead of executable functions for functions with external dependencies.`,
        );
      }
    : function (...args: any[]) {
        console.warn(`Function called with args:`, args);
        throw new Error(
          `Function requires context from imports: ${Array.from(fileContext.imports.keys()).join(', ')}. Consider using metadata mode instead of executable functions for functions with external dependencies.`,
        );
      };

  // Add metadata to the function
  (contextualFunction as any).__source = functionSource;
  (contextualFunction as any).__imports = fileContext.imports;
  (contextualFunction as any).__filePath = fileContext.filePath;

  return contextualFunction;
}

function parseObjectLiteral(
  objectLiteralNode: Node,
  filePath: string,
  options: CollectOptions = {},
  fileContext?: FileContext,
): any {
  if (!Node.isObjectLiteralExpression(objectLiteralNode)) {
    throw new Error('Expected ObjectLiteralExpression');
  }

  const result: any = {};
  const sourceFile = objectLiteralNode.getSourceFile();

  // Process each property in the object literal
  for (const property of objectLiteralNode.getProperties()) {
    if (Node.isPropertyAssignment(property)) {
      const key = getPropertyKey(property);
      if (!key) continue;

      const value = property.getInitializer();
      if (!value) continue;

      try {
        result[key] = parseValueNode(value, sourceFile, options, fileContext);
      } catch (error) {
        console.warn(`Failed to parse property ${key} in ${filePath}:`, error);
        result[key] = `[Unparseable: ${value.getKindName()}]`;
      }
    } else if (Node.isShorthandPropertyAssignment(property)) {
      const key = property.getName();
      // For shorthand properties, we need to look up the identifier
      result[key] = `[ShorthandReference: ${key}]`;
    }
  }

  return result;
}

function getPropertyKey(property: Node): string | null {
  if (!Node.isPropertyAssignment(property)) return null;

  const nameNode = property.getNameNode();

  if (Node.isIdentifier(nameNode)) {
    return nameNode.getText();
  } else if (Node.isStringLiteral(nameNode)) {
    return nameNode.getLiteralValue();
  } else if (Node.isComputedPropertyName(nameNode)) {
    return `[${nameNode.getExpression().getText()}]`;
  }

  return null;
}

function parseValueNode(
  node: Node,
  sourceFile: any,
  options: CollectOptions = {},
  fileContext?: FileContext,
): any {
  if (Node.isStringLiteral(node)) {
    return node.getLiteralValue();
  } else if (Node.isNumericLiteral(node)) {
    return node.getLiteralValue();
  } else if (Node.isTrueLiteral(node)) {
    return true;
  } else if (Node.isFalseLiteral(node)) {
    return false;
  } else if (Node.isNullLiteral(node)) {
    return null;
  } else if (Node.isArrayLiteralExpression(node)) {
    return node.getElements().map((el) => {
      try {
        return parseValueNode(el, sourceFile, options, fileContext);
      } catch (error) {
        return `[Unparseable: ${el.getKindName()}]`;
      }
    });
  } else if (Node.isObjectLiteralExpression(node)) {
    return parseObjectLiteral(node, sourceFile.getFilePath(), options, fileContext);
  } else if (
    Node.isArrowFunction(node) ||
    Node.isFunctionExpression(node) ||
    Node.isMethodDeclaration(node)
  ) {
    if (options.preserveExecutableFunctions && fileContext) {
      // Create an executable function with proper context
      try {
        return createContextualFunction(node, fileContext);
      } catch (error) {
        console.warn(`Failed to create executable function: ${error}`);
        // Fall back to metadata
      }
    }

    // Preserve function metadata
    const params =
      Node.isArrowFunction(node) || Node.isFunctionExpression(node) ? node.getParameters() : [];

    const paramNames = params.map((p) => p.getName());
    const isAsync = Node.isArrowFunction(node)
      ? node.isAsync()
      : Node.isFunctionExpression(node)
        ? node.isAsync()
        : false;

    return {
      __type: 'Function',
      async: isAsync,
      parameters: paramNames,
      body: '[Function Body]',
      source: node.getText(),
    };
  } else if (Node.isCallExpression(node)) {
    // Handle function calls like z.object(), defineConfig(), etc.
    const expression = node.getExpression();
    const args = node.getArguments();

    return {
      __type: 'CallExpression',
      function: expression.getText(),
      arguments: args.map((arg) => {
        try {
          return parseValueNode(arg, sourceFile, options, fileContext);
        } catch (error) {
          return arg.getText();
        }
      }),
    };
  } else if (Node.isIdentifier(node)) {
    // Handle variable references
    return {
      __type: 'Reference',
      name: node.getText(),
    };
  } else if (Node.isPropertyAccessExpression(node)) {
    // Handle property access like z.string()
    return {
      __type: 'PropertyAccess',
      expression: node.getText(),
    };
  } else {
    // For any other node type, return the text representation
    return {
      __type: node.getKindName(),
      source: node.getText(),
    };
  }
}
