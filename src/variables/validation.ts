import DataRaw from '@/types/data-raw'

export type KFoldCrossValidationReturnType = {
  dataParts: DataRaw.Select[][]
  modelScore?: number
}

interface KFoldCrossValidation {
  (data: DataRaw.Select[], k?: number): KFoldCrossValidationReturnType
}

// K-Fold Cross Validation for 4 parts
const kFoldCrossValidation:KFoldCrossValidation = (data, k = 4) => {
  // shuffle data
  data.sort(() => Math.random() - 0.5)

  const dataLength = data.length
  const dataLengthPerPart = Math.floor(dataLength / k)
  const dataParts:DataRaw.Select[][] = []
  for (let i = 0; i < k; i++) {
    dataParts.push(data.slice(i * dataLengthPerPart, (i + 1) * dataLengthPerPart).sort((a, b) => a.id! - b.id!))
  }

  // get the rest of data
  const restData = data.slice(k * dataLengthPerPart, dataLength).sort((a, b) => a.id! - b.id!)
  // add rest data to the last part
  dataParts[k - 1] = dataParts[k - 1].concat(restData)
  
  // get model score using linear regression
  const modelScore = dataParts.map((part, index) => {
    const dataTrain = dataParts.filter((_, i) => i !== index).flat()
    const dataTest = part
    return linearRegressionScore(dataTrain, dataTest)
  })
  return { dataParts, modelScore: modelScore.reduce((acc, cur) => acc + cur, 0) / modelScore.length }
}

export default kFoldCrossValidation

// create function to get model score using linear regression
const linearRegressionScore = (dataTrain: DataRaw.Select[], dataTest: DataRaw.Select[]) => {
  // calculate mean x of chlo_a and fosfat
  const meanX = dataTrain.reduce((acc, cur) => acc + cur.chlo_a + cur.fosfat, 0) / dataTrain.length

  // calculate mean y of kelas, kelas is 'Eutrofik', 'Oligotrofik', 'Mesotrofik'
  // so we need to convert it to number
  const kelas = ['Eutrofik', 'Oligotrofik', 'Mesotrofik']
  const meanY = dataTrain.reduce((acc, cur) => acc + kelas.indexOf(cur.kelas!), 0) / dataTrain.length

  // calculate m
  const m = dataTrain.reduce((acc, cur) => acc + (cur.chlo_a + cur.fosfat - meanX) * (kelas.indexOf(cur.kelas!) - meanY), 0) / dataTrain.reduce((acc, cur) => acc + Math.pow(cur.chlo_a + cur.fosfat - meanX, 2), 0)

  // calculate b
  const b = meanY - m * meanX

  // calculate yPred
  const yPred = dataTest.map((data) => m * (data.chlo_a + data.fosfat) + b)

  // calculate yTrue
  const yTrue = dataTest.map((data) => kelas.indexOf(data.kelas!))

  // calculate r2 score
  const r2 = 1 - yTrue.reduce((acc, cur, index) => acc + Math.pow(cur - yPred[index], 2), 0) / yTrue.reduce((acc, cur) => acc + Math.pow(cur - meanY, 2), 0)

  return r2
  
}