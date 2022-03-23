const whiteSpaceRegexp = /(\s+)/y;
const alphaNumRegExp = /[a-zA-Z0-9]/y;
const defRegEx = /def/y;
const identRegEx = /([a-zA-Z][a-zA-Z0-9]*)/y;
const eqRegEx = /eq/y;
const openExclamRegEx = /\(/y;
const closeExclamRegEx = /\)/y;
const zeroRegEx = /z/y;
const succRegEx = /s/y;
const ifRegEx = /if/y;
const thenRegEx = /then/y;
const elseRegEx = /else/y;
const eqSignRegEx = /=/y;
const colonRegEx = /,/y;


interface IdentToken {
    type: 'Ident';
    ident: string;
}

interface ColonToken {
    type: 'Colon',
}

interface DefToken {
    type: 'Def';
}

interface EqToken {
    type: 'Eq';
}

interface OpenExclamToken {
    type: 'OpenExclam';
}

interface CloseExclamToken {
    type: 'CloseExclam';
}

interface ZeroToken {
    type: 'Zero';
}

interface SuccToken {
    type: 'Succ';
}

interface IfToken {
    type: 'If';
}

interface ThenToken {
    type: 'Then';
}

interface ElseToken {
    type: 'Else';
}

interface EqualSignToken {
    type: 'EqSign';
}

interface ProgEndToken {
    type: 'ProgEnd',
}

export type Token = 
    IdentToken |
    DefToken |
    EqToken |
    OpenExclamToken |
    CloseExclamToken | 
    ZeroToken | 
    SuccToken | 
    IfToken | 
    ThenToken | 
    ElseToken |
    ColonToken |
    EqualSignToken | 
    ProgEndToken;

export interface LexerResult {
    token?: Token;
    nextIndex: number;
}

function matchDef(expr: string, curIndex: number): LexerResult {
    defRegEx.lastIndex = curIndex;
    const match = defRegEx.exec(expr);
    if (match == null) {
        return {
            nextIndex: 0,
        }
    }

    alphaNumRegExp.lastIndex = curIndex + 3;
    if (alphaNumRegExp.exec(expr) != null) {
        return {
            nextIndex: 0,
        };
    }

    return {
        token: {
            type: 'Def'
        },
        nextIndex: curIndex + 3,
    };

}

function matchEq(expr: string, curIndex: number): LexerResult {
    eqRegEx.lastIndex = curIndex;
    const match = eqRegEx.exec(expr);
    if (match == null) {
        return {
            nextIndex: 0,
        }
    }

    alphaNumRegExp.lastIndex = curIndex + 2;
    if(alphaNumRegExp.exec(expr) != null) {
        return {
            nextIndex: 0,
        }
    }

    return {
        token: { type: 'Eq'},
        nextIndex: curIndex + 2,
    };
}

function matchZero(expr: string, curIndex: number): LexerResult {
    zeroRegEx.lastIndex = curIndex;
    const match = zeroRegEx.exec(expr);
    if (match == null) {
        return {
            nextIndex: 0,
        }
    }

    alphaNumRegExp.lastIndex = curIndex + 1;
    if (alphaNumRegExp.exec(expr) != null) {
        return {
            nextIndex: 0,
        }
    }

    return {
        token: { type: 'Zero'},
        nextIndex: curIndex + 1,
    };
}

function matchSucc(expr: string, curIndex: number): LexerResult {
    succRegEx.lastIndex = curIndex;
    const match = succRegEx.exec(expr);
    if(match == null) {
        return {
            nextIndex: 0,
        }
    }

    alphaNumRegExp.lastIndex = curIndex + 1;
    if (alphaNumRegExp.exec(expr) != null) {
        return {
            nextIndex: 0,
        }
    }

    return {
        token: { type: 'Succ'},
        nextIndex: curIndex + 1,
    };
}

function matchFixedIdent(regEx: RegExp, token: Token) {
    return (expr: string, curIndex: number): LexerResult => {
        regEx.lastIndex = curIndex;
        const match = regEx.exec(expr);
        if (match == null) {
            return {
                nextIndex: 0,
            };
        }

        alphaNumRegExp.lastIndex = curIndex + match[0].length;
        if (alphaNumRegExp.exec(expr) != null) {
            return {
                nextIndex: 0,
            }
        }

        return {
            token: {...token},
            nextIndex: curIndex + match[0].length,
        };
    }
}

function matchFixed(regEx: RegExp, token: Token) {
    return (expr: string, curIndex: number): LexerResult => {
        regEx.lastIndex = curIndex;
        const match = regEx.exec(expr);
        if (match == null) {
            return {
                nextIndex: 0,
            }
        }

        return {
            token: {...token},
            nextIndex: curIndex + match[0].length, 
        }
    }
}

function matchIdent(expr: string, curIndex: number): LexerResult {
    identRegEx.lastIndex = curIndex;
    const match = identRegEx.exec(expr);
    if (match == null) {
        return {
            nextIndex: 0,
        }
    }

    return {
        token: { type: 'Ident', ident: match[0]},
        nextIndex: curIndex + match[0].length,
    };
}

type Matcher = (expr: string, curIndex: number) => LexerResult;

const matchers: Matcher[] = [
    matchFixedIdent(defRegEx, { type: 'Def'}),
    matchFixedIdent(eqRegEx, { type: 'Eq'}),
    matchFixedIdent(zeroRegEx, { type: 'Zero'}),
    matchFixedIdent(succRegEx, { type: 'Succ'}),
    matchFixedIdent(ifRegEx, { type: 'If'}),
    matchFixedIdent(thenRegEx, { type: 'Then'}),
    matchFixedIdent(elseRegEx, { type: 'Else'}),
    matchFixed(openExclamRegEx, { type: 'OpenExclam'}),
    matchFixed(closeExclamRegEx, { type: 'CloseExclam'}),
    matchFixed(eqSignRegEx, { type: 'EqSign'}),
    matchFixed(colonRegEx, { type: 'Colon'}),
    matchIdent,
];

function nextNonWhiteSpaceIndex(expr: string, currentIndex: number): number {
    whiteSpaceRegexp.lastIndex = currentIndex;
    const result = whiteSpaceRegexp.exec(expr);
    if (result == null) {
        return currentIndex;
    }

    return currentIndex + result[0].length;
}



export function getNextToken(expr: string, curIndex: number): LexerResult {
    curIndex = nextNonWhiteSpaceIndex(expr, curIndex);
    if (curIndex >= expr.length) {
        return {
            token: {
                type: 'ProgEnd',
            },
            nextIndex: 0,
        };
    }
    for(const matcher of matchers) {
        const res = matcher(expr, curIndex);
        if (res.token != null) {
            return res;
        }
    }

    return {
        nextIndex: 0,
    };
}
