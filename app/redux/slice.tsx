import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

type RouteSelectionState = {
	selectedBus: string;
	selectedRoute: string;
	selectedStop: string;
	isExpanded: boolean;
};

const initialState: RouteSelectionState = {
	selectedBus: "",
	selectedRoute: "",
	selectedStop: "",
	isExpanded: true,
};

const routeSelectionSlice = createSlice({
	name: "routeSelection",
	initialState,
	reducers: {
		setSelectedBus(state, action: PayloadAction<string>) {
			state.selectedBus = action.payload;
		},
		setSelectedRoute(state, action: PayloadAction<string>) {
			state.selectedRoute = action.payload;
			state.selectedStop = "";
		},
		setSelectedStop(state, action: PayloadAction<string>) {
			state.selectedStop = action.payload;
		},
		setIsExpanded(state, action: PayloadAction<boolean>) {
			state.isExpanded = action.payload;
		},
		resetRouteSelection() {
			return initialState;
		},
	},
});

export const {
	setSelectedBus,
	setSelectedRoute,
	setSelectedStop,
	setIsExpanded,
	resetRouteSelection,
} = routeSelectionSlice.actions;

export default routeSelectionSlice.reducer;

