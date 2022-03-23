import { eq, Nat, succ, zero } from "./naturals";

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


export interface Program {
    funcs: FuncEnv;
    vars: VarEnv;
    expression?: Exp;
}