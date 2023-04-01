import {todolistsAPI, TodolistType} from '../../api/todolists-api'
import {Dispatch} from 'redux'

import {handleServerAppError, handleServerNetworkError} from '../../utils/error-utils'
import {AppThunk} from '../../app/store';
import {appActions, RequestStatusType} from "../../app/app-reducer";
import {createSlice, PayloadAction} from "@reduxjs/toolkit";

const initialState: Array<TodolistDomainType> = []


const slice = createSlice({
    name: 'todo',
    initialState,
    reducers: {
        removeTodolistAC(state, actions: PayloadAction<{ id: string }>) {
            const index = state.findIndex(el => el.id === actions.payload.id)
            if (index !== -1) state.splice(index, 1)
        },
        addTodolistAC(state, actions: PayloadAction<{ todolist: TodolistType }>) {
            state.unshift({...actions.payload.todolist, filter: 'all', entityStatus: 'idle'})
        },
        changeTodolistTitleAC(state, actions: PayloadAction<{ id: string, title: string }>) {
            const index = state.findIndex(el => el.id === actions.payload.id)
            if (index !== -1) state[index].title = actions.payload.title
        },
        changeTodolistFilterAC(state, actions: PayloadAction<{ id: string, filter: FilterValuesType }>) {
            const index = state.findIndex(el => el.id === actions.payload.id)
            if (index !== -1) state[index].filter = actions.payload.filter
        },
        changeTodolistEntityStatusAC(state, actions: PayloadAction<{ id: string, status: RequestStatusType }>) {
            const index = state.findIndex(el => el.id === actions.payload.id)
            if (index !== -1) state[index].entityStatus = actions.payload.status
        },
        setTodoListsAC(state, actions: PayloadAction<{ todolists: TodolistType[] }>) {
            return actions.payload.todolists.map(el => ({...el, filter: 'all', entityStatus: 'idle'}))
        },
    }
})


export const todolistsReducer = slice.reducer
export const todolistActions = slice.actions


// thunks
export const fetchTodolistsTC = (): AppThunk => {
    return (dispatch) => {
        dispatch(appActions.setAppStatus({status: "loading"}))
        todolistsAPI.getTodolists()
            .then((res) => {
                dispatch(todolistActions.setTodoListsAC({todolists: res.data}))
                dispatch(appActions.setAppStatus({status: "succeeded"}))
            })
            .catch(error => {
                handleServerNetworkError(error, dispatch);
            })
    }
}
export const removeTodolistTC = (todolistId: string) => {
    return (dispatch: Dispatch) => {
        //изменим глобальный статус приложения, чтобы вверху полоса побежала
        dispatch(appActions.setAppStatus({status: "loading"}))
        //изменим статус конкретного тудулиста, чтобы он мог задизеблить что надо
        dispatch(todolistActions.changeTodolistEntityStatusAC({id: todolistId, status: 'loading'}))
        todolistsAPI.deleteTodolist(todolistId)
            .then((res) => {
                dispatch(todolistActions.removeTodolistAC({id: todolistId}))
                //скажем глобально приложению, что асинхронная операция завершена
                dispatch(appActions.setAppStatus({status: "succeeded"}))
            })
    }
}

export const addTodolistTC = (title: string) => {
    return (dispatch: Dispatch) => {
        dispatch(appActions.setAppStatus({status: "loading"}))
        todolistsAPI.createTodolist(title)
            .then((res) => {
                if (res.data.resultCode === 0) {
                    dispatch(todolistActions.addTodolistAC({todolist: res.data.data.item}))
                    dispatch(appActions.setAppStatus({status: "succeeded"}))
                } else {
                    handleServerAppError(res.data, dispatch);
                }


            })
    }
}
export const changeTodolistTitleTC = (id: string, title: string) => {
    return (dispatch: Dispatch) => {
        todolistsAPI.updateTodolist(id, title)
            .then((res) => {
                dispatch(todolistActions.changeTodolistTitleAC({id, title}))
            })
    }
}

// types


export type FilterValuesType = 'all' | 'active' | 'completed';
export type TodolistDomainType = TodolistType & {
    filter: FilterValuesType
    entityStatus: RequestStatusType
}

