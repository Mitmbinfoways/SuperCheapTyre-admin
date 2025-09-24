import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type ExampleState = {
  value: number;
};

const initialState: ExampleState = {
  value: 0,
};

const exampleSlice = createSlice({
  name: "example",
  initialState,
  reducers: {
    setValue(state, action: PayloadAction<number>) {
      state.value = action.payload;
    },
    increment(state) {
      state.value += 1;
    },
    decrement(state) {
      state.value -= 1;
    },
    reset(state) {
      state.value = 0;
    },
  },
});

export const { setValue, increment, decrement, reset } = exampleSlice.actions;
export const exampleReducer = exampleSlice.reducer;



