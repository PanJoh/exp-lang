import { eq, Nat, natToNumber, numToNat, succ, zero } from "./naturals";

export interface S {
    type: 'S';
}

export interface Eq {
    type: 'Eq';
}

export interface Zero {
    type: 'Zero';
}

export interface ZTerm {
    type: 'ZTerm';
}

export interface STerm {
    type: 'STerm';
    arg: Exp;
}

export interface Term {
    type: 'Term';
    sym: string;
    args: Exp[];
}

export interface Var {
    type: 'Var';
    sym: string;
}

export interface EqExp {
    arg1: Exp;
    arg2: Exp;
}

export interface CondTerm {
    type: 'Cond';
    cond: EqExp;
    ifExp: Exp;
    elseExp: Exp;
}

export type Exp = Term | STerm | ZTerm | CondTerm | Var;

export interface Lambda {
    args: string[];
    exp: Exp;
}

export type FuncEnv = {[sym: string]: Lambda};
export type VarEnv = {[sym: string]: Nat};

function evaluateEquExp(arg1: Exp, arg2: Exp, vars: VarEnv, funcs: FuncEnv) {
    return eq(executeExpression(arg1, vars, funcs), executeExpression(arg2, vars, funcs));
}

function executeCondTerm(cond: CondTerm, vars: VarEnv, funcs: FuncEnv) {
    if(evaluateEquExp(cond.cond.arg1, cond.cond.arg2, vars, funcs)) {
        return executeExpression(cond.ifExp, vars, funcs);
    }

    return executeExpression(cond.elseExp, vars, funcs);
}

function executeTerm(term: Term, vars: VarEnv, funcs: FuncEnv) {
    const lam = funcs[term.sym];
    if (lam == null) {
        return zero();
    }

    const argEnv = lam.args.reduce((env, arg, idx) => {
        if (idx >= term.args.length) {
            return {
                ...env,
                [arg]: zero(),
            }
        }

        return {
            ...env,
            [arg]: executeExpression(term.args[idx], vars, funcs),
        }
    }, {} as VarEnv);

    return executeExpression(lam.exp, argEnv, funcs);
}

function evaluateVariable(sym: string, vars: VarEnv) {
    return vars[sym] ?? zero();
}

export function executeExpression(exp: Exp, vars: VarEnv, funcs: FuncEnv): Nat {
    switch(exp.type) {
        case 'ZTerm': return zero();
        case 'STerm': return succ(executeExpression(exp.arg, vars, funcs));
        case 'Cond': return executeCondTerm(exp, vars, funcs);
        case 'Term': return executeTerm(exp, vars, funcs);
        case 'Var': return evaluateVariable(exp.sym, vars);
    }
}

function executeLambda(lamb: Lambda| string, funcs: FuncEnv, ...args: Nat[]) {
    if (typeof lamb === 'string') {
        lamb = funcs[lamb];
    }


    const vars = lamb.args.reduce((env, arg, idx) => {
        if (idx >= args.length) {
            return {
                ...env,
                [arg]: zero(),
            };
        }

        return {
            ...env,
            [arg]: args[idx],
        }
    }, {} as VarEnv)


    return executeExpression(lamb.exp, vars, funcs);
}

const predItExpression: Exp = {
    type: 'Cond',
    cond: {
        arg1: {
            type: 'STerm',
            arg: { type: 'Var', sym: 'p'}
        },
        arg2: {
            type: 'Var',
            sym: 'x',
        }
    },
    ifExp: {
        type: 'Var',
        sym: 'p',
    },
    elseExp: {
        type: 'Term',
        sym: 'predIt',
        args: [{ type: 'STerm', arg: {type: 'Var', sym: 'p'}}, {type: 'Var', sym: 'x'}]
    },
};

const predItLambda: Lambda = {
    args: ['p', 'x'],
    exp: predItExpression,
};

const predExpr: Exp = {
    type: 'Term',
    sym: 'predIt',
    args: [{type: 'ZTerm'}, {type: 'Var', sym: 'x'}],
};

const predLambda: Lambda = {
    args: ['x'],
    exp: predExpr,
};

const addExp: Exp = {
    type: 'Cond',
    cond: {
        arg1: { type: 'ZTerm'},
        arg2: { type: 'Var', sym: 'a'},
    },
    ifExp: { type: 'Var', sym: 'b'},
    elseExp: { 
        type: 'Term',
        sym: 'add', 
        args: [{type: 'Term', sym: 'pred', args: [{type: 'Var', sym: 'a'}]}, {type: 'STerm', arg: {type: 'Var', sym: 'b'}}],
    }
};

const addLambda: Lambda = {
    args: ['a', 'b'],
    exp: addExp,
};



const res = executeLambda('add', {
    'add': addLambda,
    'pred': predLambda,
    'predIt': predItLambda,
}, numToNat(100), numToNat(3));

console.log(`the result is ${natToNumber(res)}`);


export interface Program {
    funcs: FuncEnv;
    vars: VarEnv;
    expression?: Exp;
}