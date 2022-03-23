export interface Zero {
    type: 'Zero'
}

export interface Succ {
    type: 'Succ'
    value: Succ | Zero;
}

export type Nat = Zero | Succ;

export function succ(n: Nat): Nat {
    return {
        type: 'Succ',
        value: n,
    };
}

export function zero(): Nat {
    return {
        type: 'Zero',
    };
}

export function eq(a: Nat, b: Nat): boolean {
    if (a.type === 'Zero') {
        return b.type === 'Zero'
    }

    if(b.type !== 'Succ') {
        return false;
    }

    return eq(a.value, b.value);
}

export function numToNatRec(n: number): Nat {
    if (n > 0) {
        return succ(numToNat(n - 1));
    }

    return zero();
}

export function numToNat(n: number): Nat {
    return numToNatRec(Math.floor(n));
}


export function natToNumber(nat: Nat): number {
    if (nat.type === 'Zero') {
        return 0;
    }

    return natToNumber(nat.value) + 1;
}
