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

const InputContainer = (props: {
  index: number
}) => {
  return (
    <div className={styles.gridContainer+' box'}>
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
  const [k, setK] = useState(1)

  useEffect(() => {
    const data = localStorage.getItem('predictData')
    if (data) {
      setPredictData(JSON.parse(data))
    }

    getData()
  }, [getData])

  const handleFormAddPredict = (e:SyntheticEvent) => {
    e.preventDefault()

    const form = e.currentTarget as HTMLFormElement
    const inputs = form.querySelectorAll('input')
    
    const chloA: number[] = []
    const fosfat: number[] = []

    inputs.forEach((input, i) => {
      if (i%2 === 0) {
        chloA.push(Number(input.value))
      } else {
        fosfat.push(Number(input.value))
      }
    })

    const data: DataRaw.Select[] = chloA.map((chloA, i) => ({
      id: i+1,
      chlo_a: chloA,
      fosfat: fosfat[i],
    }))
    
    setPredictData(data)
    localStorage.setItem('predictData', JSON.stringify(data))
  }

  const handleProcessPredict = () => {
    const model = new KNN(k)

    const dataTrainX = data.map(item => [item.chlo_a, item.fosfat])
    const dataTrainY = data.map(item => item.kelas as Label)

    const dataPredictX = predictData.map(item => [item.chlo_a, item.fosfat])

    model.train(dataTrainX, dataTrainY)
    const predictions = model.predict(dataPredictX)

    setPredictData(predictData.map((item, index) => ({
      ...item,
      kelasPredict: predictions.predictions[index].label,
      distance: predictions.predictions[index].distance,
      distances: predictions.predictions[index].distances,
    })))
  }

  const predictDataLength = getVisibleLength(predictData)
  const dataLength = getVisibleLength(data)

  return (
    <div>
      <h1 className={globalStyles.title}>Predict</h1>

      <ul className={styles.collapseContainer}>
        <li>
          <details className={styles.detailsContainer}>
            <summary>Isi data untuk prediksi</summary>
            <form className={styles.form} onSubmit={handleFormAddPredict}>
              {
                Array.from({ length }).map((_, i) => (<InputContainer key={i} index={i+1} />))
              }
              <button
                type='button'
                className={styles.btnAddPredict}
                onClick={() => {
                  setLength(length+1)
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

      <form className={styles.kForm+' join'} onSubmit={(e) => {
        e.preventDefault()
        handleProcessPredict()
      }}>
        <input 
          type="number" 
          className={styles.inputK + ' join-item'} 
          placeholder='Insert K here... (Default: K=1)' 
          onChange={(e) => {
            setK(Number(e.target.value))
          }}
        />
        <button
          className={styles.btnProcess + ' join-item'}
          type='submit'
          disabled={!!!(k%2)}
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