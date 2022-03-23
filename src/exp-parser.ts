import { Lambda, Program, Exp, CondTerm, EqExp, STerm, Var, ZTerm, Term, FuncEnv, VarEnv, executeExpression} from "./exp";
import { getNextToken } from "./exp-lexer";

interface EqCond {
    arg1: Expression;
    arg2: Expression;
}

interface SuccExpr {
    type: 'Succ';
    arg: Expression;
}

interface ZeroExpr {
    type: 'Zero';
}

interface FuncCallExpression {
    type: 'FuncCall';
    ident: string;
    args: Expression[];
}

interface VariableExpression {
    type: 'Var',
    ident: string;
}

interface CondExpression {
    type: 'Cond';
    cond: EqCond;
    thenExp: Expression;
    elseExp: Expression;
}

type Expression = CondExpression | SuccExpr | FuncCallExpression | ZeroExpr | VariableExpression;

interface VariableDefinition {
    ident: string;
    type: 'Var',
    value: Expression;
}

interface FunctionDefinition {
    ident: string;
    type: 'Func',
    args: string[];
    body: Expression;
}

type Definition = VariableDefinition | FunctionDefinition;

export interface Ast {
    definitions: Definition[];
    prog?: Expression;
}

function parseDefinition(prog: string, curIdx: number): [Definition, number] {
    let lexerRes = getNextToken(prog, curIdx);
    let funcArgs: string[] | undefined;
    if (lexerRes.token == null) {
        throw new Error('invalid program');
    }

    if(lexerRes.token.type !== 'Ident') {
        throw new Error('invalid prgram');
    }

    const ident = lexerRes.token.ident;

    lexerRes = getNextToken(prog, lexerRes.nextIndex);
    if (lexerRes.token == null) {
        throw new Error('invalid program');
    }

    if(lexerRes.token.type === 'OpenExclam') {
        const argsRes = parseFunctionArgs(prog, lexerRes.nextIndex);
        funcArgs = argsRes[0];
        lexerRes = getNextToken(prog, argsRes[1]);
        if (lexerRes.token == null) {
            throw new Error('invalid program');
        }
    }

    if(lexerRes.token.type !== 'EqSign') {
        throw new Error('invalid program');
    }

    const defExprRes = parseExpression(prog, lexerRes.nextIndex);
    const def: Definition = funcArgs != null ? {
        ident,
        type: 'Func',
        args: funcArgs,
        body: defExprRes[0],
    } : {
        ident,
        type: 'Var',
        value: defExprRes[0],
    };

    return [def, defExprRes[1]];

}

function parseCondExpr(prog: string, curIdx: number): [CondExpression, number] {
    let lexerRes = getNextToken(prog, curIdx);
    if (lexerRes.token == null) {
        throw new Error('invalid program');
    }

    if (lexerRes.token.type !== 'OpenExclam') {
        throw new Error('invalid program');
    }

    lexerRes = getNextToken(prog, lexerRes.nextIndex);
    if (lexerRes.token == null) {
        throw new Error('invalid program');
    }

    if (lexerRes.token.type !== 'Eq') {
        throw new Error('invalid program');
    }

    lexerRes = getNextToken(prog, lexerRes.nextIndex);

    if (lexerRes.token?.type !== 'OpenExclam') {
        throw new Error('invalid program');
    }

    let argExpRes = parseExpression(prog, lexerRes.nextIndex);
    const arg1 = argExpRes[0];

    lexerRes = getNextToken(prog, argExpRes[1]);
    if (lexerRes.token == null) {
        throw new Error('invalid program');
    }

    if (lexerRes.token.type !== 'Colon') {
        throw new Error('invalid program');
    }

    argExpRes = parseExpression(prog, lexerRes.nextIndex);
    const arg2 = argExpRes[0];

    lexerRes = getNextToken(prog, argExpRes[1]);
    if (lexerRes.token == null) {
        throw new Error('invalid program');
    }

    if (lexerRes.token.type !== 'CloseExclam') {
        throw new Error('invalid program');
    }

    lexerRes = getNextToken(prog, lexerRes.nextIndex);
    if(lexerRes.token == null) {
        throw new Error('invalid program');
    }

    if (lexerRes.token.type !== 'CloseExclam') {
        throw new Error('invalid program');
    }

    lexerRes = getNextToken(prog, lexerRes.nextIndex);
    if (lexerRes.token == null) {
        throw new Error('invalid program');
    }

    if(lexerRes.token.type !== 'Then') {
        throw new Error('invalid program');
    }

    const thenExpRes = parseExpression(prog, lexerRes.nextIndex);
    const thenExp = thenExpRes[0];

    lexerRes = getNextToken(prog, thenExpRes[1]);
    if (lexerRes.token == null || lexerRes.token.type !== 'Else') {
        throw new Error('invalid program');
    }

    const elseExpRes = parseExpression(prog, lexerRes.nextIndex);
    const elseExp = elseExpRes[0];

    return [
        {
            type: 'Cond',
            cond: {
                arg1,
                arg2,
            },
            thenExp,
            elseExp,
        },
        elseExpRes[1],
    ];
}

function parseSuccExpression(prog: string, curIdx: number): [SuccExpr, number] {
    let lexerRes = getNextToken(prog, curIdx);
    if (lexerRes.token == null || lexerRes.token.type !== 'OpenExclam') {
        throw new Error('invalid program');
    }

    const valueExpRes = parseExpression(prog, lexerRes.nextIndex);
    lexerRes = getNextToken(prog, valueExpRes[1]);
    if (lexerRes.token == null || lexerRes.token.type !== 'CloseExclam') {
        throw new Error('invalid program');
    }

    return [
        {
            type: 'Succ',
            arg: valueExpRes[0],
        },
        lexerRes.nextIndex,
    ];
}

function parseExpression(prog: string, curIdx: number): [Expression, number] {
    const lexerRes = getNextToken(prog, curIdx);
    if (lexerRes.token == null) {
        throw new Error('invalid program');
    }

    if (lexerRes.token.type == 'If') {
        return parseCondExpr(prog, lexerRes.nextIndex);
    }

    if (lexerRes.token.type == 'Succ') {
        return parseSuccExpression(prog, lexerRes.nextIndex);
    }

    if (lexerRes.token.type == 'Zero') {
        return [{type: 'Zero'}, lexerRes.nextIndex];
    }

    if (lexerRes.token.type == 'Ident') {
        if (prog[lexerRes.nextIndex] === '(') {
            const callArgsRes = parseCallArgs(prog, lexerRes.nextIndex + 1);
            return [
                {
                    type: 'FuncCall',
                    ident: lexerRes.token.ident,
                    args: callArgsRes[0]
                },
                callArgsRes[1],
            ];
        }

        return [
            {
                type: 'Var',
                ident: lexerRes.token.ident,
            },
            lexerRes.nextIndex,
        ];
    }

    throw new Error('invalid program');

}


function parseFunctionArgs(prog: string, curIdx: number): [string[], number] {
    const args: string[] = [];
    while(true) {
        let lexerRes = getNextToken(prog, curIdx);
        if (lexerRes.token == null) {
            throw new Error('invalid program');
        }

        if (lexerRes.token.type !== 'Ident') {
            throw new Error('invalid program');
        }

        args.push(lexerRes.token.ident);
        curIdx = lexerRes.nextIndex;

        lexerRes = getNextToken(prog, curIdx);
        if (lexerRes.token == null) {
            throw new Error('invalid program');
        }



        if (lexerRes.token.type == 'Colon') {
            curIdx = lexerRes.nextIndex;
            continue;
        }

        if (lexerRes.token.type == 'CloseExclam') {
            return [args, lexerRes.nextIndex];
        }

        throw new Error('invalid program');
    }
}

function parseCallArgs(prog: string, curIdx: number): [Expression[], number] {
    const args: Expression [] = [];
    while(true) {
        const exprRes = parseExpression(prog, curIdx);
        args.push(exprRes[0]);
        curIdx = exprRes[1];
        let lexerRes = getNextToken(prog, curIdx);
        if (lexerRes.token == null) {
            throw new Error('invalid program');
        }


        if (lexerRes.token.type === 'CloseExclam') {
            return [args, lexerRes.nextIndex];
        }

        lexerRes = getNextToken(prog, curIdx);
        if (lexerRes.token == null) {
            throw new Error('invalid program');
        }

        if (lexerRes.token.type === 'Colon') {
            curIdx = lexerRes.nextIndex;
            continue;
        }

        throw new Error('invalid program');
    }
}
 
export function parse(prog: string): Ast {
    const definitions: Definition[] = [];
    let progExp: Expression | undefined;
    let curIdx = 0;
    while(true) {
        const lexerRes = getNextToken(prog, curIdx);
        if (lexerRes.token == null) {
            throw new Error('invalid program');
        }


        if (lexerRes.token.type == 'ProgEnd') {
            return {
                definitions,
                prog: progExp,
            }
        }

        if (lexerRes.token.type == 'Def') {
            curIdx = lexerRes.nextIndex;
            const defResult = parseDefinition(prog, curIdx);
            curIdx = defResult[1];
            definitions.push(defResult[0]);
            continue;
        }

        if(['Ident', 'Zero', 'Succ', 'If'].includes(lexerRes.token.type)) {
            const exprResult = parseExpression(prog, curIdx);
            const nextLexerRes = getNextToken(prog, exprResult[1]);
            if(nextLexerRes.token == null) {
                throw new Error('invalid program');
            }

            if(nextLexerRes.token.type !== 'ProgEnd') {
                throw new Error('programm must end after evaluation expression');
            }

            return {
                definitions,
                prog: exprResult[0],
            };
        }

        throw new Error('invalid program');
    }
}

function transformEqCondToEqExp(eqCond: EqCond): EqExp {
    return {
        arg1: transformAstExpToExp(eqCond.arg1),
        arg2: transformAstExpToExp(eqCond.arg2),
    };
}

function transformCondExpressionToCondTerm(condExp: CondExpression): CondTerm {
    return {
        type: 'Cond',
        cond: transformEqCondToEqExp(condExp.cond),
        ifExp: transformAstExpToExp(condExp.thenExp),
        elseExp: transformAstExpToExp(condExp.elseExp),
    }
}

function transformSuccExpToSuccTerm(succExp: SuccExpr): STerm {
    return {
        type: 'STerm',
        arg: transformAstExpToExp(succExp.arg),
    };
}

function transformVarExpToVar(varExp: VariableExpression): Var {
    return {
        type: 'Var',
        sym: varExp.ident,
    };
}

function transformZeroExpToZeroTerm(): ZTerm {
    return {
        type: 'ZTerm',
    };
}

function transformFuncCallExpToTerm(funcCall: FuncCallExpression): Term {
    return {
        type: 'Term',
        sym: funcCall.ident,
        args: funcCall.args.map(arg => transformAstExpToExp(arg)),
    };
}

function transformAstExpToExp(exp: Expression): Exp {
    switch (exp.type) {
        case 'Cond':
            return transformCondExpressionToCondTerm(exp);
        case 'Succ': 
            return transformSuccExpToSuccTerm(exp);
        case 'Var': 
            return transformVarExpToVar(exp);
        case 'Zero':
            return transformZeroExpToZeroTerm();
        case 'FuncCall':
            return transformFuncCallExpToTerm(exp);        
    }
}

function transformFunctionToLambda(funcDef: FunctionDefinition): Lambda {
    return {
        args: funcDef.args,
        exp: transformAstExpToExp(funcDef.body),
    }
}

function transformDefinitionsToExpEnvs(definitions: Definition[]): [VarEnv, FuncEnv] {
    const funcEnv: FuncEnv = {};
    const varEnv: VarEnv = {};

    for (const definition of definitions) {
        if (definition.type !== 'Func') {
            continue;
        }

        funcEnv[definition.ident] = transformFunctionToLambda(definition);
    }

    for (const definition of definitions) {
        if (definition.type !== 'Var') {
            continue;
        }

        const exp = transformAstExpToExp(definition.value);
        const value = executeExpression(exp, varEnv, funcEnv);
        varEnv[definition.ident] = value;
    }

    return [varEnv, funcEnv];
}

export function tranformAstToExpProgram(ast: Ast): Program {
    const [varEnv, funcEnv] = transformDefinitionsToExpEnvs(ast.definitions);
    let exp: Exp | undefined;
    if (ast.prog != null) {
        exp = transformAstExpToExp(ast.prog);
    }

    return {
        vars: varEnv,
        funcs: funcEnv,
        expression: exp,
    };
}