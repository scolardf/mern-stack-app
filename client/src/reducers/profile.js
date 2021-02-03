import {
	CLEAR_PROFILE,
	GET_PROFILE,
	UPDATE_PROFILE,
	PROFILE_ERROR,
} from '../actions/types';

const initialState = {
	profile: null,
	profiles: [],
	repos: [],
	loading: true,
	error: {},
};

export default function (state = initialState, action) {
	const { type, payload } = action;

	switch (type) {
		case GET_PROFILE:
		case UPDATE_PROFILE:
			return {
				...state,
				profile: payload,
				loading: false,
			};

		case PROFILE_ERROR:
			return {
				...state,
				error: payload,
				loading: false,
			};
		case CLEAR_PROFILE:
			return {
				...state,
				profile: null,
				repos: [],
			};
		default:
			return state;
	}
}
