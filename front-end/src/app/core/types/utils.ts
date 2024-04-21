export type Nullable<Type> = {
    [Property in keyof Type]: Type[Property] | null;
};
