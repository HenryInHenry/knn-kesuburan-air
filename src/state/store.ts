import { detectColorScheme } from '@/hooks/theme'
import DataRaw from '@/types/data-raw'
import supabase from '@/variables/supabase'
import SweetAlertOption from '@/variables/sweetalert2'
import kFoldCrossValidation, { KFoldCrossValidationReturnType } from '@/variables/validation'
import { Action, Thunk, action, createStore, thunk } from 'easy-peasy'
import Swal from 'sweetalert2'

export interface GlobalState {
  // data: typeof DataRaw.Select[]
  data: DataRaw.Select[]
  setData: Action<GlobalState, DataRaw.Select[]>
  getData: Thunk<GlobalState>
  updateData: Thunk<GlobalState, { data: DataRaw.Select, id: number }>
  deleteData: Thunk<GlobalState, { ids: number[] }>
  storeData: Thunk<GlobalState, DataRaw.Select>
  uploadData: Thunk<GlobalState, DataRaw.Select[]>

  dataPartial: DataRaw.Select[][]
  setDataPartial: Action<GlobalState, DataRaw.Select[][]>
  separateData: Thunk<GlobalState>

  isLoading: boolean
  setLoading: Action<GlobalState, boolean>

  kFoldCrossValidation: KFoldCrossValidationReturnType
  setKFoldCrossValidation: Action<GlobalState, KFoldCrossValidationReturnType>

  theme: 'light' | 'dark'
  setTheme: Action<GlobalState, 'light' | 'dark'>

  setSelectedDataTest: Action<GlobalState, number[]>
  selectedDataTest: number[]
}

const store = createStore<GlobalState>({
  data: [],
  setData: action((state, payload) => {
    state.data = payload
  }),
  getData: thunk(async (actions) => {
    actions.setLoading(true)
    const { data, error } = await supabase.from('data_raw').select('*').order('id', { ascending: true })
    if (!error) {
      actions.setData(data)
    } else {

      Swal.fire({
        ...SweetAlertOption.error,
        text: error.message
      })
    }
    actions.setLoading(false)
    return data
  }),
  updateData: thunk(async (actions, payload) => {
    actions.setLoading(true)
    const { data, error } = await supabase
      .from('data_raw')
      .update(payload.data)
      .eq('id', payload.id)
      .select('*')

    actions.setLoading(false)

    if (!error) {
      actions.getData()
      Swal.fire({
        ...SweetAlertOption.success,
        text: 'Data berhasil diupdate'
      })
    }
  }),
  deleteData: thunk(async (actions, payload) => {
    actions.setLoading(true)
    const { data, error } = await supabase
      .from('data_raw')
      .delete()
      .in('id', payload.ids)
      .select('*')

    actions.setLoading(false)

    if (!error) {
      actions.getData()
      Swal.fire({
        ...SweetAlertOption.success,
        text: 'Data berhasil dihapus'
      })
    }
  }),
  storeData: thunk(async (actions, payload) => {
    actions.setLoading(true)
    const { data, error } = await supabase
      .from('data_raw')
      .insert({
        chlo_a: payload.chlo_a || 0,
        fosfat: payload.fosfat || 0,
        kelas: payload.kelas || '',
      })
      .select('*')

    actions.setLoading(false)

    if (!error) {
      actions.getData()
      Swal.fire({
        ...SweetAlertOption.success,
        text: 'Data berhasil disimpan'
      })
    }
  }),
  uploadData: thunk(async (actions, payload) => {
    actions.setLoading(true)

    Swal.update({
      ...SweetAlertOption.loading,
      title: 'Menyimpan data',
      html: 'Mohon tunggu sebentar'
    })
    Swal.showLoading()
    const { data, error } = await supabase
      .from('data_raw')
      .insert(payload.map((item) => ({
        chlo_a: item.chlo_a || 0,
        fosfat: item.fosfat || 0,
        kelas: item.kelas || '',
      })))
      .select('*')

    actions.setLoading(false)

    if (!error) {
      actions.getData()
      Swal.hideLoading()
      Swal.update({
        ...SweetAlertOption.success,
        title: 'Berhasil',
        showConfirmButton: true,
        confirmButtonText: 'OK',
        html: 'Data berhasil disimpan'
      })
    }
  }),

  dataPartial: typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('dataPartial') || '[]') : [],
  setDataPartial: action((state, payload) => {
    state.dataPartial = payload
  }),
  separateData: thunk((actions) => {
    const result = kFoldCrossValidation(store.getState().data)
    actions.setDataPartial(result.dataParts)

    console.log(result)

    actions.setKFoldCrossValidation(result)

    // store to local storage
    localStorage.setItem('dataPartial', JSON.stringify(result.dataParts))
  }),

  kFoldCrossValidation: { dataParts: [], modelScore: 0 },
  setKFoldCrossValidation: action((state, payload) => {
    state.kFoldCrossValidation = payload
  }),

  isLoading: false,
  setLoading: action((state, payload) => {
    state.isLoading = payload
  }),

  theme: detectColorScheme(),
  setTheme: action((state, payload) => {
    state.theme = payload
  }),

  selectedDataTest: [],
  setSelectedDataTest: action((state, payload) => {
    state.selectedDataTest = payload
  })
})

export default store