import { executeExpression } from "./exp";
import { getNextToken, LexerResult } from "./exp-lexer";
import { Ast, parse, tranformAstToExpProgram } from './exp-parser';
import { natToNumber} from './naturals';

const defString = 'def '
const commonIdentifier = 'someIdent';
const defPrefixedIdentifier = 'defSomeIdent ';

const variableDefinition = 'def var1 = s(s(z))';

const functionDefinition = 'def myFunc(x1, x2) = add(x1, x2)';

const expression = "func1(func2(z, x1), func3(s(s(z))), s(z))"

const funcDefAndExpression = 'def add3(x1) = add(x1, s(s(s(z))))\n add3(s(z))'
const ifExpression = 'if (eq(x1, s(s(z)))) then add(inc(x1), x2) else sub(x1, x2)'

let lexerResult: LexerResult | null = null;

let parseResult: Ast | null = null;

// lexerResult = getNextToken(defString, 0);
// console.log(lexerResult);

// lexerResult = getNextToken(commonIdentifier, 0);
// console.log(lexerResult);

// lexerResult = getNextToken(defPrefixedIdentifier, 0);
// console.log(lexerResult);



function lexExpression(expr: string) {
    let currIdx = 0;
    let parseNext = true;

    while(parseNext) {
        lexerResult = getNextToken(expr, currIdx);
        console.log(lexerResult);
        if (lexerResult.token != null && lexerResult.token.type !== 'ProgEnd') {
            currIdx = lexerResult.nextIndex;
        } else {
            parseNext = false;
        }
    }
}

console.log();
lexExpression(variableDefinition);

console.log();
lexExpression(functionDefinition);

console.log();
lexExpression(expression);

console.log();
lexExpression(funcDefAndExpression);

console.log()
parseResult = parse(funcDefAndExpression);
console.log(parseResult);

console.log();
parseResult = parse(ifExpression);
console.log(JSON.stringify(parseResult, null, 2));

const program = `
def x1 = s(s(z))
def x2 = s(z)
def predIt(x, y) = if(eq(s(x), y)) then x else predIt(s(x), y)
def pred(x) = predIt(z, x)
def add(a, b) = if(eq(a, z)) then b else add(pred(a), s(b))
def x3 = add(x1, x2)
x3
`

const ast = parse(program);
const prog = tranformAstToExpProgram(ast);
if (prog.expression != null) {
    const result = executeExpression(prog.expression, prog.vars, prog.funcs);
    console.log(`The result is ${natToNumber(result)}`)
}
