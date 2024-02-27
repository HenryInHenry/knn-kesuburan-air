'use client'
import globalStyles from '@/app/global.module.css'
import { useStoreActions, useStoreState } from '@/state/hooks'
import DataRaw from '@/types/data-raw'
import Process from '@/types/procedure'
import { removeDuplicatesLevel1 } from '@/variables/helpers'
import KNN, { ConfusionMatrix, Label } from '@/variables/knn'
import SweetalertParams from '@/variables/sweetalert2'
import getVisibleLength from '@/variables/visibleLength'
import {
  SelectClickTypes,
} from '@table-library/react-table-library/select'
import { MiddlewareFunction } from '@table-library/react-table-library/types/common'
import { TableNode } from '@table-library/react-table-library/types/table'
import { useEffect, useState } from 'react'
import { CiPickerHalf } from 'react-icons/ci'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
import Client from './client'
import DataTable2 from './dataTable2'
import DataTable from './datatable'
import Loading from './loading'
import Procedure from './procedure'
import styles from './test.module.css'
import { MdClear } from 'react-icons/md'


const Test = () => {
  const { dataPartial: dataPartialState, selectedDataTest, data } = useStoreState(state => state)
  const { setSelectedDataTest, getData } = useStoreActions(actions => actions)
  const [calculatedData, setCalculatedData] = useState<DataRaw.Select[]>([])
  const [confustionMatrix, setConfustionMatrix] = useState<ConfusionMatrix>({})
  const [indexTrain, setIndexTrain] = useState<number[]>([])
  const [indexTest, setIndexTest] = useState<number>(0)
  const [dataTrain, setDataTrain] = useState<DataRaw.Select[]>([])
  const [k, setK] = useState(5)

  const [process, setProcess] = useState<Process[]>([])

  useEffect(() => {
    getData()
    const dataTestXYPredict = localStorage.getItem('dataTestXYPredict')
    const confustionMatrix = localStorage.getItem('confustionMatrix')
    const trainData = localStorage.getItem('trainData')
    const proce = localStorage.getItem('testProcess')

    if (dataTestXYPredict && confustionMatrix && trainData && proce) {
      setCalculatedData(JSON.parse(dataTestXYPredict))
      setConfustionMatrix(JSON.parse(confustionMatrix))
      setDataTrain(JSON.parse(trainData))
    }
    const proceData = localStorage.getItem('proceData')
    if (proceData) callProcess(JSON.parse(proceData))

    const k = localStorage.getItem('kTest')
    if (k) setK(parseInt(k))

    const selectedDataTest = localStorage.getItem('selectedDataTest')
    if (selectedDataTest) setSelectedDataTest(JSON.parse(selectedDataTest))
  }, [getData])

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
        // console.log(indexTrain, indexTest)

        // get dataTrain and dataTest
        let dataTrain = dataPartial.filter((item, index) => indexTrain.includes(index)).flat()
        let dataTest = temp[indexTest]

        if (selectedDataTest.length) {
          dataTrain = data.filter(item => !selectedDataTest.includes(item.id!))
          dataTest = data.filter(item => selectedDataTest.includes(item.id!))
        }

        // sort dataTrain
        dataTrain = dataTrain.sort((a, b) => a.id! - b.id!)

        setDataTrain(dataTrain)


        console.log({ dataTrain })
        console.log({ dataTest })

        // console.log({ indexTrain })
        // console.log({ indexTest })

        setIndexTrain(indexTrain)
        setIndexTest(selectedDataTest.length ? -1 : dataPartial.findIndex(item => item === dataTest))

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

        localStorage.setItem('kTest', k.toString())
        // KNN
        const model = new KNN(k)
        // model.train(dataTrainX, dataTrainY)

        model.weighted.train(dataTrainX, dataTrainY)

        const predictions = model.predict(dataTestX)

        const weightedPredictions = model.weighted.predict(dataTestX)

        // console.log({ predictions })

        // merge dataTestX, dataTestY back to {chlo_a, fosfat, kelas}
        const dataTestXY = dataTestX.map((item, index) => {
          return {
            chlo_a: item[0],
            fosfat: item[1],
            kelas: dataTestY[index]
          }
        })

        // merge dataTestXY, predictions back to {chlo_a, fosfat, kelas, kelasPredict}
        const dataTestXYPredict = dataTestXY.map((item, index) => {
          return {
            id: dataTestRest[index].id as number,
            chlo_a: item.chlo_a,
            fosfat: item.fosfat,
            kelas: item.kelas,
            kelasPredict: weightedPredictions[index].label,
            // distance: weightedPredictions[index].distance,
            weights: weightedPredictions[index].weights,
            created_at: dataTestRest[index].created_at,
            updated_at: dataTestRest[index].updated_at,
          }
        })

        // console.log({ dataTestXYPredict })

        // calculate confusion matrix
        const confustionMatrix = model.confusionMatrix(dataTestY, weightedPredictions.map(item => item.label))

        console.log({ confustionMatrix })

        // sort dataTestXYPredict
        dataTestXYPredict.sort((a, b) => a.id! - b.id!)

        setCalculatedData(dataTestXYPredict)
        setConfustionMatrix(confustionMatrix)

        const proceData = {
          first: model.getDistanceBetweenData()!.map((item, idx) => ({
            chloA: item[idx].item[0],
            fosfat: item[idx].item[1],
            label: item[idx].label,
            distance: '',
            nodes: item.sort((a, b) => a.distance - b.distance)
              .filter(a => a.distance !== 0).map((i, idx2) => ({
                id: i.id,
                chloA: i.item2[0],
                fosfat: i.item2[1],
                label: i.label2,
                distance: i.distance,
                isSelected: idx2 < k,
              }))
          })),
          second: model.getValidites()!.map((item, idx) => ({
            chloA: item.data[idx][0],
            fosfat: item.data[idx][1],
            label: dataTrainY[idx],
            validity: item.validity,
            nodes: item.dataSortedByDistance.map((i, idx2) => ({
              id: i.id,
              chloA: i.data[0],
              fosfat: i.data[1],
              label: i.label,
              validity: i.validity
            }))
          })),
          third: model.getWeights()!.map((item, idx) => ({
            chloA: item[idx].item[0],
            fosfat: item[idx].item[1],
            label: item[idx].label,
            weight: model.majorityVote(
              item.sort((a, b) => b.weight - a.weight)
                .filter(a => a.distance !== 0).map((i, idx2) => (
                  i.label2
                ))
                .slice(0, k)
            ),
            nodes: item.sort((a, b) => b.weight - a.weight)
              .filter(a => a.distance !== 0).map((i, idx2) => ({
                id: i.id,
                chloA: i.item2[0],
                fosfat: i.item2[1],
                label: i.label2,
                weight: i.weight,
                isSelected: idx2 < k,
              }))
          })),
          fourth: dataTestXYPredict.map((item, idx) => ({
            chloA: item.chlo_a,
            fosfat: item.fosfat,
            label: item.kelas,
            weight: item.kelasPredict,
            nodes: item.weights!
              .map((i, idx2) => ({
                id: i.id,
                chloA: i.data[0],
                fosfat: i.data[1],
                label: i.label,
                weight: i.weight,
                isSelected: idx2 < k
              }))
          }))
        }
        localStorage.setItem('proceData', JSON.stringify(proceData))
        // set process
        callProcess(proceData)

        // store dataTestXYPredict and confustionMatrix to localStorage
        localStorage.setItem('dataTestXYPredict', JSON.stringify(dataTestXYPredict))
        localStorage.setItem('confustionMatrix', JSON.stringify(confustionMatrix))
        localStorage.setItem('trainData', JSON.stringify(dataTrain))
      }

    } catch (error) {
      // console.log(error)
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: JSON.stringify(error),
        ...SweetalertParams.error
      })
    }
  }

  function callProcess(proceData: { first: { chloA: number; fosfat: number; label: Label; distance: string; nodes: { id: string | number; chloA: number; fosfat: number; label: Label; distance: number; isSelected: boolean }[] }[]; second: { chloA: number; fosfat: number; label: Label; validity: number; nodes: { id: string | number; chloA: number; fosfat: number; label: Label; validity: number }[] }[]; third: { chloA: number; fosfat: number; label: Label; weight: Label; nodes: { id: string | number; chloA: number; fosfat: number; label: Label; weight: number; isSelected: boolean }[] }[]; fourth: { chloA: number; fosfat: number; label: Label; weight: Label; nodes: { id: string | number; chloA: number; fosfat: number; label: Label; weight: number; isSelected: boolean }[] }[] }) {
    const proce = [
      {
        title: 'Distance Between Train Data',
        content: (
          <Client>
            <DataTable2
              columns={[
                {
                  id: 'chloA',
                  title: 'Chlo A',
                  sort: false,
                  width: 'auto',
                },
                {
                  id: 'fosfat',
                  title: 'Fosfat',
                  sort: false,
                  width: 'auto',
                },
                {
                  id: 'label',
                  title: 'Label',
                  sort: false,
                  width: 'auto',
                },
                {
                  id: 'distance',
                  title: 'distance',
                  sort: false,
                  width: 'auto',
                },
              ]}
              data={proceData.first}
              enableTree />
          </Client>
        )
      },
      {
        title: 'Validasi Data Training',
        content: (
          <Client>
            <DataTable2
              columns={[
                {
                  id: 'chloA',
                  title: 'Chlorophile A',
                  sort: false,
                  width: 'auto',
                },
                {
                  id: 'fosfat',
                  title: 'Fosfat',
                  sort: false,
                  width: 'auto',
                },
                {
                  id: 'label',
                  title: 'Label',
                  sort: false,
                  width: 'auto',
                },
                {
                  id: 'validity',
                  title: 'Validity',
                  sort: false,
                  width: 'auto',
                },
              ]}
              data={proceData.second}
              enableTree />
          </Client>
        )
      },
      {
        title: 'Perhitungan Weight Voting (Train)',
        content: (
          <Client>
            <DataTable2
              columns={[
                {
                  id: 'chloA',
                  title: 'Chlorophile A',
                  sort: false,
                  width: 'auto',
                },
                {
                  id: 'fosfat',
                  title: 'Fosfat',
                  sort: false,
                  width: 'auto',
                },
                {
                  id: 'label',
                  title: 'Actual Label',
                  sort: false,
                  width: 'auto',
                },
                {
                  id: 'weight',
                  title: 'Weight / Predicted Label',
                  sort: false,
                  width: 'auto',
                },
              ]}
              data={proceData.third}
              enableTree />
          </Client>
        )
      },
      {
        title: 'Perhitungan Weight Voting (Test)',
        content: (
          <Client>
            <DataTable2
              columns={[
                {
                  id: 'chloA',
                  title: 'Chlorophile A',
                  sort: false,
                  width: 'auto',
                },
                {
                  id: 'fosfat',
                  title: 'Fosfat',
                  sort: false,
                  width: 'auto',
                },
                {
                  id: 'label',
                  title: 'Actual Label',
                  sort: false,
                  width: 'auto',
                },
                {
                  id: 'weight',
                  title: 'Weight / Predicted Label',
                  sort: false,
                  width: 'auto',
                },
              ]}
              data={proceData.fourth}
              enableTree />
          </Client>
        )
      },
    ]
    setProcess(proce)
    return proce
  }

  const calculatedDataLength = getVisibleLength(calculatedData)

  const ReactSwal = withReactContent(Swal)

  const handlePick = () => {
    ReactSwal.fire({
      title: 'Pilih data test',
      text: 'Disarankan pilih 10% sampai 25% jumlah data yang ada.',
      html: (
        <Client>
          <HandlePick />
        </Client>
      )
    })
  }
  console.log(data.filter(a => selectedDataTest.includes(a.id!)))
  return (
    <div>
      <h1 className={globalStyles.title}>Test</h1>

      {process.length ? <Procedure process={process} /> : <></>}

      <form className={styles.kForm + ' join'} onSubmit={(e) => {
        e.preventDefault()
        handlePredict()
      }}>
        <input
          type="number"
          className={styles.inputK + ' sm:join-item w-full'}
          placeholder='Insert K here... (Default: K=5)'
          onChange={(e) => {
            setK(Number(e.target.value))
          }}
          defaultValue={k}
        />
        {selectedDataTest.length ? <button type='button' className={styles.btnClear + ' sm:join-item w-full sm:w-max'}
          onClick={() => {
            setSelectedDataTest([])
          }}
        >
          <MdClear size={24} />
        </button> : <></>}
        <button
          type='submit'
          className={styles.testButton + ' sm:join-item w-full sm:w-max'}
          disabled={!!!(k % 2)}
        >
          {`Predict With ${selectedDataTest.length ? 'Choosen' : 'Random'} Test Data`}
        </button>
        <button type='button' className={styles.btnPick + ' sm:join-item w-full sm:w-max'}
          onClick={handlePick}
        >
          <CiPickerHalf size={24} />
        </button>
      </form>


      <p>Tabel {indexTrain.map(i => i + 1).join('-')} sebagai train.</p>
      <p>Tabel {indexTest + 1} sebagai test.</p>

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
        tableData={{
          nodes:
            (selectedDataTest.length
              ? data
                .filter(a => selectedDataTest.includes(a.id!))
                .map((a, idx) => ({ ...a, kelasPredict: calculatedData[idx].kelasPredict || ' ' }))
              : calculatedData) as TableNode[]
        }}
        length={calculatedDataLength}
      />

      <h2>Train Data</h2>
      <p>Length: {dataTrain.length}</p>
      <DataTable tableData={{ nodes: dataTrain as TableNode[] }} />
    </div>
  )
}

const HandlePick = () => {
  const { getData, setSelectedDataTest } = useStoreActions((actions) => actions)
  const { data, isLoading, selectedDataTest } = useStoreState((state) => state)
  const [ids, setIds] = useState<number[]>([])

  useEffect(() => {
    getData()
    const selectedDataTest = localStorage.getItem('selectedDataTest')
    if (selectedDataTest) setIds(JSON.parse(selectedDataTest))
  }, [getData, setIds])

  const handleSelect = (
    action: {
      payload: {
        ids: number[]
        options: {
          isCarryForward: boolean
          isPartialToAll: boolean
        }
      }
    },
    state: {
      id: null
      ids: number[]
    }
  ) => {
    const ids = removeDuplicatesLevel1(state.ids)
    localStorage.setItem('selectedDataTest', JSON.stringify(ids))
    setSelectedDataTest(ids)
    setIds(ids)
  }

  const percent10 = Math.floor(data.length / 10)
  const percent25 = Math.floor(data.length / 4)

  return (
    <>
      <p>{`Terpilih: ${ids.length}`}</p>
      <div className='join'>
        <button
          className={styles.btnClear + ' join-item'}
          onClick={() => {
            setIds([])
            setSelectedDataTest([])
            Swal.close()
          }}
        >
          <MdClear size={24} />
        </button>
        <button
          className={styles.btnChoose + ' join-item'}
          disabled={!(percent10 <= ids.length && ids.length <= percent25)}
          onClick={() => {
            Swal.close()
          }}
        >
          {percent10 <= ids.length && ids.length <= percent25 ? 'Confirm' : `Pilih 10%(${percent10}) sampai 25%(${percent25})`}
        </button>
      </div>
      {
        !isLoading ? (
          data.length ? <DataTable
            tableData={{ nodes: data as TableNode[] }}
            onSelect={handleSelect as unknown as MiddlewareFunction}
            enableSelect
            defaultSelects={ids}
            clickType={SelectClickTypes.RowClick}
          /> : <span>No Data</span>
        ) : (
          <div className={styles.loadingContainer}>
            <Loading size='lg' />
          </div>
        )
      }
    </>
  )
}

export default Test