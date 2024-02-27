'use client'

import globalStyles from '@/app/global.module.css'
import DataRaw from '@/types/data-raw'
import { SyntheticEvent, createRef, useEffect, useState } from 'react'
import styles from './predict.module.css'
import { MdDelete } from 'react-icons/md'
import DataTable from './datatable'
import { TableNode } from '@table-library/react-table-library/types/table'
import { useStoreActions, useStoreState } from '@/state/hooks'
import KNN, { ConfusionMatrix, Label } from '@/variables/knn'
import getVisibleLength from '@/variables/visibleLength'
import Client from './client'
import DataTable2 from './dataTable2'
import Process from '@/types/procedure'
import Procedure from './procedure'

const InputContainer = (props: {
  index: number
}) => {
  return (
    <div className={styles.gridContainer + ' box'}>
      <span>{props.index}</span>
      <div>
        <label htmlFor={`chlo_a-${props.index}`} className={styles.inputLabel}>Chlo A</label>
        <input
          pattern="^\d*(\.\d{0,8})?$"
          required
          name={`chlo_a-${props.index}`}
          id={`chlo_a-${props.index}`}
          placeholder='Klorofil A...'
          className={styles.formInput}
        />
      </div>
      <div>
        <label htmlFor={`fosfat-${props.index}`} className={styles.inputLabel}>Fosfat</label>
        <input
          pattern="^\d*(\.\d{0,8})?$"
          required
          name={`fosfat-${props.index}`}
          id={`fosfat-${props.index}`}
          placeholder='Fosfat...'
          className={styles.formInput}
        />
      </div>
      <button
        type="button"
        className={styles.formDestroy}
        onClick={(e) => {
          e.currentTarget.closest('div.box')?.remove()
        }}
      >
        <MdDelete size={24} />
      </button>
    </div>
  )
}

const Predict = () => {
  const [predictData, setPredictData] = useState<DataRaw.Select[]>([])
  const [length, setLength] = useState(1)
  const { data } = useStoreState(state => state)
  const { getData } = useStoreActions(actions => actions)
  const [k, setK] = useState(5)
  const [process, setProcess] = useState<Process[]>([])

  useEffect(() => {
    const data = localStorage.getItem('predictData')
    if (data) {
      setPredictData(JSON.parse(data))
    }

    getData()

    const processData = localStorage.getItem('proceDataPredict')
    if (processData) callProcess(JSON.parse(processData))

    const k = localStorage.getItem('kPredict')
    if (k) setK(parseInt(k))
  }, [getData])

  const handleFormAddPredict = (e: SyntheticEvent) => {
    e.preventDefault()

    const form = e.currentTarget as HTMLFormElement
    const inputs = form.querySelectorAll('input')

    const chloA: number[] = []
    const fosfat: number[] = []

    inputs.forEach((input, i) => {
      if (i % 2 === 0) {
        chloA.push(Number(input.value))
      } else {
        fosfat.push(Number(input.value))
      }
    })

    const data: DataRaw.Select[] = chloA.map((chloA, i) => ({
      id: i + 1,
      chlo_a: chloA,
      fosfat: fosfat[i],
    }))

    setPredictData(data)
    localStorage.setItem('predictData', JSON.stringify(data))
  }

  const handleProcessPredict = () => {
    localStorage.setItem('kPredict', k.toString())
    const model = new KNN(k)

    const dataTrainX = data.map(item => [item.chlo_a, item.fosfat])
    const dataTrainY = data.map(item => item.kelas as Label)

    const dataPredictX = predictData.map(item => [item.chlo_a, item.fosfat])

    model.weighted.train(dataTrainX, dataTrainY)
    // const predictions = model.predict(dataPredictX)
    const weightedPredictions = model.weighted.predict(dataPredictX)

    const finalPredict = predictData.map((item, index) => ({
      ...item,
      kelasPredict: weightedPredictions[index].label,
      // distance: predictions.predictions[index].distance,
      weights: weightedPredictions[index].weights,
      // distances: predictions.predictions[index].distances,
    }))

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
      fourth: finalPredict.map((item, idx) => ({
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
    localStorage.setItem('proceDataPredict', JSON.stringify(proceData))
    // set process
    callProcess(proceData)

    setPredictData(finalPredict)
  }

  function callProcess(proceData: {
    first: {
      chloA: number
      fosfat: number
      label: Label
      distance: string
      nodes: {
        id: string | number
        chloA: number
        fosfat: number
        label: Label
        distance: number
        isSelected: boolean
      }[]
    }[]
    second: {
      chloA: number
      fosfat: number
      label: Label
      validity: number
      nodes: {
        id: string | number
        chloA: number
        fosfat: number
        label: Label
        validity: number
      }[]
    }[]
    third: {
      chloA: number
      fosfat: number
      label: Label
      weight: Label
      nodes: {
        id: string | number
        chloA: number
        fosfat: number
        label: Label
        weight: number
        isSelected: boolean
      }[]
    }[]
    fourth: {
      chloA: number;
      fosfat: number;
      label: string | undefined;
      weight: Label;
      nodes: {
        id: string | number;
        chloA: number;
        fosfat: number;
        label: Label;
        weight: number;
        isSelected: boolean;
      }[];
    }[]
  }) {
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
        title: 'Prediksi Data Baru Terhadap Semua Data Train',
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

  const predictDataLength = getVisibleLength(predictData)
  const dataLength = getVisibleLength(data)
  console.log(predictData)
  return (
    <div>
      <h1 className={globalStyles.title}>Predict</h1>

      {process.length ? <Procedure process={process} /> : <></>}

      <ul className={styles.collapseContainer}>
        <li>
          <details className={styles.detailsContainer}>
            <summary>Isi data untuk prediksi</summary>
            <form className={styles.form} onSubmit={handleFormAddPredict}>
              {
                Array.from({ length }).map((_, i) => (<InputContainer key={i} index={i + 1} />))
              }
              <button
                type='button'
                className={styles.btnAddPredict}
                onClick={() => {
                  setLength(length + 1)
                }}
              >
                Tambah Data Prediksi
              </button>
              <button
                type='submit'
                className={styles.btnSubmit}
              >
                Submit
              </button>
            </form>
          </details>

        </li>
      </ul>

      <form className={styles.kForm + ' join'} onSubmit={(e) => {
        e.preventDefault()
        handleProcessPredict()
      }}>
        <input
          type="number"
          className={styles.inputK + ' join-item'}
          placeholder={`Insert K here... (Default: K=${k})`}
          onChange={(e) => {
            setK(Number(e.target.value))
          }}
          defaultValue={k}
        />
        <button
          className={styles.btnProcess + ' join-item'}
          type='submit'
          disabled={!!!(k % 2)}
        >
          Process Predict
        </button>
      </form>

      {/* Data Predict */}
      <h2 className={styles.subTitle}>Predict Data</h2>
      <DataTable tableData={{ nodes: predictData as TableNode[] }} length={predictDataLength} />

      <h2 className={styles.subTitle}>Train Data</h2>
      <DataTable tableData={{ nodes: data as TableNode[] }} />
    </div>
  )
}



export default Predict