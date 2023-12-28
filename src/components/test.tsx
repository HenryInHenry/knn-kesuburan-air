'use client'
import { useStoreState } from '@/state/hooks'
import globalStyles from '@/app/global.module.css'
import KNN, { ConfusionMatrix, Label } from '@/variables/knn'
import styles from './test.module.css'
import { useEffect, useState } from 'react'
import DataTable from './datatable'
import DataRaw from '@/types/data-raw'
import Swal from 'sweetalert2'
import SweetalertParams from '@/variables/sweetalert2'
import kFoldCrossValidation from '@/variables/validation'
import { TableNode } from '@table-library/react-table-library/types/table'
import getVisibleLength from '@/variables/visibleLength'


const Test = () => {
  const { dataPartial: dataPartialState } = useStoreState(state => state)
  const [calculatedData, setCalculatedData] = useState<DataRaw.Select[]>([])
  const [confustionMatrix, setConfustionMatrix] = useState<ConfusionMatrix>({})
  const [indexTrain, setIndexTrain] = useState<number[]>([])
  const [indexTest, setIndexTest] = useState<number>(0)
  const [dataTrain, setDataTrain] = useState<DataRaw.Select[]>([])
  const [k, setK] = useState(1)

  useEffect(() => {
    const dataTestXYPredict = localStorage.getItem('dataTestXYPredict')
    const confustionMatrix = localStorage.getItem('confustionMatrix')
    const trainData = localStorage.getItem('trainData')

    if (dataTestXYPredict && confustionMatrix && trainData) {
      setCalculatedData(JSON.parse(dataTestXYPredict))
      setConfustionMatrix(JSON.parse(confustionMatrix))
      setDataTrain(JSON.parse(trainData))
    }
  }, [])

  const handlePredict = () => {
    try {
      const dataPartial = JSON.parse(localStorage.getItem('dataPartial') as string) as DataRaw.Select[][] || dataPartialState
      if (dataPartial.length) {
        const temp = [...dataPartial]
        // generate random index for dataTrain without duplicate
        let indexTrain: number[] = []
        let indexTest: number = 0
        do {
          indexTrain = Array.from({ length: 3 }, () => Math.floor(Math.random() * temp.length))
          indexTest = Math.floor(Math.random() * temp.length)
        } while (indexTrain[0] === indexTrain[1] || indexTrain[0] === indexTrain[2] || indexTrain[1] === indexTrain[2] || indexTrain.includes(indexTest))
        console.log(indexTrain, indexTest)

        // get dataTrain and dataTest
        let dataTrain = dataPartial.filter((item, index) => indexTrain.includes(index)).flat()
        const dataTest = temp[indexTest]

        // sort dataTrain
        dataTrain = dataTrain.sort((a, b) => a.id! - b.id!)

        setDataTrain(dataTrain)


        console.log({ dataTrain })
        console.log({ dataTest })

        console.log({ indexTrain })
        console.log({ indexTest })

        setIndexTrain(indexTrain)
        setIndexTest(dataPartial.findIndex(item => item === dataTest))

        const dataTrainX = dataTrain.map(item => [item.chlo_a as number, item.fosfat as number])
        const dataTrainY = dataTrain.map(item => item.kelas as Label)
        const dataTrainRest = dataTrainX.map((item, index) => {
          return {
            created_at: dataTrain[index].created_at,
            updated_at: dataTrain[index].updated_at,
          }
        })

        const dataTestX = dataTest.map(item => [item.chlo_a, item.fosfat])
        const dataTestY = dataTest.map(item => item.kelas as Label)
        const dataTestRest = dataTestX.map((item, index) => {
          return {
            id: dataTest[index].id as number,
            created_at: dataTest[index].created_at as string,
            updated_at: dataTest[index].updated_at as string,
          }
        })

        // KNN
        const model = new KNN(k)
        model.train(dataTrainX, dataTrainY)

        const predictions = model.predict(dataTestX)

        console.log({ predictions })
      
        // merge dataTestX, dataTestY back to {chlo_a, fosfat, kelas}
        const dataTestXY = dataTestX.map((item, index) => {
          return {
            chlo_a: item[0],
            fosfat: item[1],
            kelas: dataTestY[index]
          }
        })

        // merge dataTestXY, predictions back to {chlo_a, fosfat, kelas, kelasPredict}
        const dataTestXYPredict: DataRaw.Select[] = dataTestXY.map((item, index) => {
          return {
            id: dataTestRest[index].id as number,
            chlo_a: item.chlo_a,
            fosfat: item.fosfat,
            kelas: item.kelas,
            kelasPredict: predictions.predictions[index].label,
            distance: predictions.predictions[index].distance,
            distances: predictions.predictions[index].distances,
            created_at: dataTestRest[index].created_at,
            updated_at: dataTestRest[index].updated_at,
          }
        })

        console.log({ dataTestXYPredict })

        // calculate confusion matrix
        const confustionMatrix = model.confusionMatrix(dataTestY, predictions.predictions.map(item => item.label))

        // console.log({confustionMatrix})

        // sort dataTestXYPredict
        dataTestXYPredict.sort((a, b) => a.id! - b.id!)

        setCalculatedData(dataTestXYPredict)
        setConfustionMatrix(confustionMatrix)

        // store dataTestXYPredict and confustionMatrix to localStorage
        localStorage.setItem('dataTestXYPredict', JSON.stringify(dataTestXYPredict))
        localStorage.setItem('confustionMatrix', JSON.stringify(confustionMatrix))
        localStorage.setItem('trainData', JSON.stringify(dataTrain))
      }

    } catch (error) {
      console.log(error)
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: JSON.stringify(error),
        ...SweetalertParams.error
      })
    }
  }

  const calculatedDataLength = getVisibleLength(calculatedData)


  return (
    <div>
      <h1 className={globalStyles.title}>Test</h1>

      <form className={styles.kForm+' join'} onSubmit={(e) => {
        e.preventDefault()
        handlePredict()
      }}>
        <input 
          type="number" 
          className={styles.inputK + ' sm:join-item w-full'} 
          placeholder='Insert K here... (Default: K=1)' 
          onChange={(e) => {
            setK(Number(e.target.value))
          }}
        />
        <button
          type='submit'
          className={styles.testButton + ' sm:join-item w-full sm:w-max'}
          disabled={!!!(k%2)}
        >
        Predict With Test Data
        </button>
      </form>


      <p>Tabel {indexTrain.map(i => i+1).join('-')} sebagai train.</p>
      <p>Tabel {indexTest+1} sebagai test.</p>

      <h2>Confusion Matrix</h2>
      <div className={styles.confusionMatrix}>
        {
          Object.values(confustionMatrix).map((value, index) => (
            <p key={index}>
              {Object.keys(confustionMatrix)[index]}: {value}
            </p>
          ))
        }
      </div>

      
      <h2>Hasil Prediksi Data Test</h2>
      <p>Length: {calculatedData.length}</p>
      <DataTable 
        tableData={{ nodes: calculatedData as TableNode[] }} 
        length={calculatedDataLength} 
      />

      <h2>Train Data</h2>
      <p>Length: {dataTrain.length}</p>
      <DataTable tableData={{ nodes: dataTrain as TableNode[] }} />
    </div>
  )
}

export default Test