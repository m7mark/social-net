import { Dispatch } from "redux";
import { ThunkAction } from "redux-thunk";
import { userAPI } from "../api/api";
import { updateObjectInArray } from "../components/utils/object-helpers";
import { UserType } from "../types/types";
import { AppStateType, InferActionsType } from "./store";

let initialState = {
    users: [] as Array<UserType>,
    pageSize: 6,
    totalUsersCount: 0,
    currentPage: 1,
    isFetching: false,
    followingInProgress: [] as Array<number> // Array of Users Id
}
type InitialState = typeof initialState
const usersReducer = (state = initialState, action: ActionsTypes):
    InitialState => {
    switch (action.type) {
        case 'FOLLOW':
            return {
                ...state,
                users: updateObjectInArray(
                    state.users, action.userId, "id", { followed: true }
                )
            }

        case 'UNFOLLOW':
            return {
                ...state,
                users: updateObjectInArray(
                    state.users, action.userId, "id", { followed: false }
                )
            }
        case 'SET_USERS':
            return { ...state, users: action.users }

        case 'SET_CURRENT_PAGE':
            return { ...state, currentPage: action.currentPage }

        case 'SET_TOTAL_USERS_COUNT':
            return { ...state, totalUsersCount: action.count }

        case 'TOGGLE_IS_FETCHING':
            return { ...state, isFetching: action.isFetching }

        case 'TOGGLE_IS_FOLLOWING_PROGRESS':
            return {
                ...state, followingInProgress: action.isFetching
                    ? [...state.followingInProgress, action.userId]
                    : state.followingInProgress.filter(id => id !== action.userId)
            }

        default:
            return state;
    }
}
type ActionsTypes = InferActionsType<typeof actions>

export const actions = {
    followSuccess: (userId: number) => ({ type: 'FOLLOW', userId } as const),
    unfollowSuccess: (userId: number) => ({ type: 'UNFOLLOW', userId } as const),
    setUsers: (users: Array<UserType>) => ({ type: 'SET_USERS', users } as const),
    setCurrentPage: (currentPage: number) => ({ type: 'SET_CURRENT_PAGE', currentPage } as const),
    setTotalUsersCount: (totalCount: number) => ({ type: 'SET_TOTAL_USERS_COUNT', count: totalCount } as const),
    toggleIsFetching: (isFetching: boolean) => ({ type: 'TOGGLE_IS_FETCHING', isFetching } as const),
    toggleFollowingProgress: (isFetching: boolean, userId: number) => ({ type: 'TOGGLE_IS_FOLLOWING_PROGRESS', isFetching, userId } as const)
}
type ThunkType = ThunkAction<Promise<void>, AppStateType, unknown, ActionsTypes>

const _followUnfollowFlow = async (
    dispatch: Dispatch<ActionsTypes>,
    id: number,
    apiMethod: any,
    actionCreator: (id: number) => ActionsTypes) => {
    dispatch(actions.toggleFollowingProgress(true, id));
    const data = await apiMethod(id)
    if (data.resultCode === 0) { dispatch(actionCreator(id)) }
    dispatch(actions.toggleFollowingProgress(false, id));
}

export const getUsers = (currentPage: number, pageSize: number): ThunkType =>
    async (dispatch, getstate) => {
        dispatch(actions.toggleIsFetching(true));
        const data = await userAPI.getUsers(currentPage, pageSize);
        dispatch(actions.setCurrentPage(currentPage));
        dispatch(actions.toggleIsFetching(false));
        dispatch(actions.setUsers(data.items));
        dispatch(actions.setTotalUsersCount(data.totalCount));
    }
export const follow = (id: number): ThunkType => {
    return async (dispatch) => {
        let apiMethod = userAPI.follow.bind(userAPI);
        _followUnfollowFlow(dispatch, id, apiMethod, actions.followSuccess);
    }
}
export const unfollow = (id: number): ThunkType => {
    return async (dispatch) => {
        let apiMethod = userAPI.unfollow.bind(userAPI);
        _followUnfollowFlow(dispatch, id, apiMethod, actions.unfollowSuccess);
    }
}
export default usersReducer;
