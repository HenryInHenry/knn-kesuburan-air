import DataRaw from '@/types/data-raw'

function getVisibleLength(data: DataRaw.Select[]) {
  return data[0] ? Object.values(data.map(a => {
    const { created_at, updated_at, distances, weights, ...rest } = a
    return rest
  })[0]).length : 0
}


export default getVisibleLength