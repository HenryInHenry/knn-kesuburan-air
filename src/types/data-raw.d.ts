import { Label } from '@/variables/knn'

namespace DataRaw {
  interface Select {
    id?: number,
    chlo_a: number,
    fosfat: number,
    kelas?: string,
    kelasPredict?: string,
    weights?: {label: Label, weight: number}[]
    distance?: number,
    distances?: {label: Label, distance: number}[],
    updated_at?: string,
    created_at?: string,
  }
}

export default DataRaw