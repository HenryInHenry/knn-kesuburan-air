'use client'

import globalStyles from '@/app/global.module.css'
import { useStoreActions, useStoreState } from '@/state/hooks'
import { useTheme } from '@table-library/react-table-library/theme'
import { useEffect } from 'react'
import DataTable from './datatable'
import Loading from './loading'
import styles from './train.module.css'
import { TableNode } from '@table-library/react-table-library/types/table'
import getVisibleLength from '@/variables/visibleLength'

const Train = () => {
  const { getData, separateData } = useStoreActions((actions) => actions)
  const { data, dataPartial, kFoldCrossValidation } = useStoreState((state) => state)


  useEffect(() => {
    getData().then(() => {
    })
    console.log('data sync')
  }, [getData])

  const theme = useTheme({
    Table: `
        --data-table-library_grid-template-columns:  30px 120px 70px 100px 200px 200px;
        min-width: 400px;
      `,
    BaseCell: `
        border-bottom-width: 1px;
        border-color: #949494;
        padding: 4px;
        background-color: transparent;
      `,
  })

  const dataPartialByPartLength = getVisibleLength(dataPartial.length ? dataPartial[0] : [])

  return (
    <>
      <h1 className={globalStyles.title}>Train</h1>
      {
        data.length ? (
          <>
            <button onClick={() => separateData()} autoFocus className={styles.shuffleButton}>
            Shuffle and Split Data
            </button>
            <div className="hidden">
              {
                kFoldCrossValidation.modelScore ? (
                  <p>K Fold Cross Validation Score: {kFoldCrossValidation.modelScore}</p>
                ) : <></>
              }
            </div>
            <h2 className={styles.subTitle + ' !text-left'}>Registered ID Per Part</h2>
            <div>{
              dataPartial.map((data, idx) => {
                return (
                  <div key={idx}>
                    <div>table {idx + 1} (length: {data.length})</div>
                    <span>{data.map(a => a.id).sort((a, b) => a! - b!).join('-')}</span>
                  </div>
                )
              })
            }</div>
            <h2 className={styles.subTitle + ' !text-left'}>All Registered ID (length: {data.length})</h2>
            <p>{data.map(a => a.id).sort((a, b) => a! - b!).join('-')}</p>
            <p>Membagi data menggunakan K-Fold Cross Validation menjadi 4 bagian seperti berikut:</p>
          </>
        ) : (
          <div className={styles.loadingContainer}>
            <Loading size='lg' />
          </div>
        )
      }
      <div className={styles.container}>
        {
          data.length ? (dataPartial.length ? dataPartial.map((data, idx) => (
            <div key={idx}>
              <h2 className={styles.subTitle}>table {idx + 1} (length: {data.length})</h2>
              <DataTable tableData={{ nodes: data as TableNode[] }} length={dataPartialByPartLength} />
            </div>
          )) : (
            !data.length ? (
              <div className={styles.loadingContainer}>
                <Loading size='lg' />
              </div>
            ) : (
              <></>
            )
        
          )) : (
            <></>
          )
        }
      </div>
    </>
  )
}

export default Train