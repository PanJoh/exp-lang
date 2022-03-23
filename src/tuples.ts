import { Nat } from "./naturals";

export type Tuple = Nat[];

export function proj(n: number): (t: Tuple) => Nat {
    return (t) => {
        if (t.length < n) {
            throw new Error(`tuple has less elements then ${n}`)
        }

        return t[n - 1];
    }
}