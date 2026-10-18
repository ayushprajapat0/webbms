import { configureStore } from "@reduxjs/toolkit";
import routeSelectionReducer from "./slice";

export const store = configureStore({
	reducer: {
		routeSelection: routeSelectionReducer,
	},
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

