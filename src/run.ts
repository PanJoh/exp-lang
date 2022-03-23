import { Ast, parse, tranformAstToExpProgram } from "./exp-parser";
import * as fs from 'fs';
import * as path from 'path';
import { Program, executeExpression } from "./exp";
import { natToNumber } from "./naturals";

const progParam = process.argv[2];


function run() {
    if (progParam == null) {
        console.log('no programm file given');
        return;
    }

    const filePath = path.resolve(process.cwd(), progParam);

    const progText = fs.readFileSync(filePath, {encoding: 'utf8'});

    let ast: Ast;
    try {
        ast = parse(progText);
    } catch (err) {
        if (err instanceof Error) {
            console.error(err.message);
            return;
        }

        console.error('there was a fatal error parsing the program');
        return;
    }

    let prog: Program;
    try {
        prog = tranformAstToExpProgram(ast);
    } catch (err) {
        if (err instanceof Error) {
            console.error(err.message);
            return;
        }

        console.error('there fas a fatal error in the program');
        return;
    }

    if (prog.expression == null) {
        console.log('the program has no final expression');
        return;
    }

    const result = executeExpression(prog.expression, prog.vars, prog.funcs);
    console.log(`The result is ${natToNumber(result)}`)
}

run();