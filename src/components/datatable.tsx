import DataRaw from '@/types/data-raw'
import Time from '@/variables/time'
import withReactContent from 'sweetalert2-react-content'
import {
  Body,
  Cell,
  Data,
  Header,
  HeaderCell,
  HeaderRow,
  Row,
  Table,
  TableNode
} from '@table-library/react-table-library/table'
import { useTheme } from '@table-library/react-table-library/theme'
import {
  useSort,
  HeaderCellSort,
} from '@table-library/react-table-library/sort'
import styles from './datatable.module.css'
import { MiddlewareFunction } from '@table-library/react-table-library/types/common'
import Swal from 'sweetalert2'
import SweetalertParams from '@/variables/sweetalert2'
import { MdDownload } from 'react-icons/md'
import downloadAsCSV from '@/variables/download'
import {
  HeaderCellSelect,
  CellSelect,
  useRowSelect,
} from '@table-library/react-table-library/select'
import { useEffect, useState } from 'react'


type Props = {
  tableData: Data<TableNode>
  length?: number
  downloadable?: boolean
  onSelect?: MiddlewareFunction
  enableSelect?: boolean
}

const DataTable = (props: Props) => {
  const finalLength = ((props.length || 4) - (props.enableSelect ? 0 : 1))

  const theme = useTheme({
    Table: `
        --data-table-library_grid-template-columns: 50px repeat(${finalLength}, minmax(0px, 1fr)) !important;
        min-width: 600px;
      `,
    BaseCell: `
        border-bottom-width: 1px;
        border-color: #949494;
        padding: 4px;
        background-color: transparent;

        &:first-of-type {
          font-weight: bold;
          // width: 25px !important;
        }
      `,
    HeaderCell: `
        font-weight: bold;;
      `,
  })

  const onSortChange: MiddlewareFunction = (action, state) => {
    // console.log(action, state)
  }

  const onSelectChange: MiddlewareFunction = (action, state, context) => {
    if(props.onSelect) {
      props.onSelect(action, state, context)
    }
  }

  const select = useRowSelect(props.tableData, {
    onChange: onSelectChange,
  })

  const sort = useSort(props.tableData, {
    onChange: onSortChange
  },
  {
    sortFns: {
      // @ts-ignore 
      ID: (array) => array.sort((a, b) => a.id - b.id),
      // @ts-ignore 
      CHLOROPHYLL: (array) => array.sort((a, b) => a.chlo_a - b.chlo_a),
      // @ts-ignore 
      PHOSPHATE: (array) => array.sort((a, b) => a.fosfat - b.fosfat),
      // @ts-ignore 
      FERTILITY: (array) => array.sort((a, b) => a.kelas.localeCompare(b.kelas)),
      // @ts-ignore 
      FERTILITY_PREDICT: (array) => array.sort((a, b) => a.kelasPerdict.localeCompare(b.kelasPerdict)),
      // @ts-ignore
      DISTANCE: (array) => array.sort((a, b) => a.distance - b.distance),
      // @ts-ignore 
      CREATED_AT: (array) => array.sort((a, b) => a.created_at - b.created_at),
      // @ts-ignore 
      UPDATED_AT: (array) => array.sort((a, b) => a.updated_at - b.updated_at),
    }
  })

  const ReactSwal = withReactContent(Swal)

  return (
    <div className={styles.container}>
      <button 
        className={styles.downloadButton + (props.downloadable ? '' : ' !hidden')}
        onClick={() => {
          // exclude distances
          const data = props.tableData.nodes.map(item => {
            const { distances, ...rest } = item
            return rest
          })
          downloadAsCSV(data, 'data.csv')
        }}
      >
        <MdDownload size={14} />
      </button>
      <Table data={props.tableData} theme={theme} sort={sort} select={select}>
        {(tableList: DataRaw.Select[]) => (
          <>
            <Header>
              <HeaderRow>
                {
                  props.enableSelect ? (<HeaderCellSelect />) : <></>
                }
                <HeaderCellSort sortKey='ID'>ID</HeaderCellSort>
                <HeaderCellSort sortKey='CHLOROPHYLL'>Chlorophyll A</HeaderCellSort>
                <HeaderCellSort sortKey='PHOSPHATE'>Phosphate</HeaderCellSort>
                {
                  // tableList has kelas
                  tableList[0]?.kelas !== undefined
                    ? (
                      <HeaderCellSort sortKey='FERTILITY'>Fertility</HeaderCellSort>
                    ) : <></>
                }
                {
                  // tableList has kelasPredict
                  tableList[0]?.kelasPredict !== undefined
                    ? (
                      <HeaderCellSort sortKey='FERTILITY_PREDICT'>Fertility Predict</HeaderCellSort>
                    ) : <></>
                }
                {
                  // tableList has distance
                  tableList[0]?.distance !== undefined
                    ? (
                      <HeaderCellSort sortKey='DISTANCE'>Distance</HeaderCellSort>
                    ) : <></>
                }
                <HeaderCellSort sortKey='CREATED_AT' hide>Created At</HeaderCellSort>
                <HeaderCellSort sortKey='UPDATED_AT' hide>Updated At</HeaderCellSort>
              </HeaderRow>
            </Header>
            <Body>
              {tableList.map((item) => (
                <Row
                  key={item.id}
                  item={item as TableNode}
                  onClick={() => {
                    ReactSwal.fire({
                      title: 'Data',
                      html: (
                        <>
                          <div className={styles.sweetAlertGrid}>
                            <span>ID:</span> <span>{item.id}</span>
                            <span>Klorofil A:</span> <span>{item.chlo_a}</span>
                            <span>Fosfat:</span> <span>{item.fosfat}</span>
                            <span>Kelas:</span> <span>{item.kelas}</span>
                            {
                              // has kelasPredict
                              item.kelasPredict ? (
                                <>
                                  <span>Kelas Prediksi:</span> <span>{item.kelasPredict}</span>
                                </>
                              ) : <></>
                            }
                            {
                              // has distance
                              typeof item.distance !== 'undefined' ? (
                                <>
                                  <span>Jarak:</span> <span>{item.distance}</span>
                                </>
                              ) : <></>
                            }
                            {
                              // has created_at
                              typeof item.created_at !== 'undefined' ? (
                                <>
                                  <span>Dibuat:</span> <span>{Time.format(item.created_at)}</span>
                                </>
                              ) : <></>
                            }
                            {
                              // has updated_at
                              typeof item.updated_at !== 'undefined' ? (
                                <>
                                  <span>Diubah:</span> <span>{Time.format(item.updated_at)}</span>
                                </>
                              ) : <></>
                            }
                          </div>
                          {
                            typeof item.distances !== 'undefined' ? (
                              <table className={styles.sweetAlertTable}>
                                <thead>
                                  <tr>
                                    <th>Label</th>
                                    <th>Distance</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {
                                    item.distances?.length ? (
                                      item.distances.map((distance, idx) => (
                                        <tr key={idx}>
                                          <td>{distance.label}</td>
                                          <td>{distance.distance}</td>
                                        </tr>
                                      ))
                                    ) : <></>
                                  }
                                </tbody>
                              </table>
                            ) : <></>
                          }
                        </>
                      ),
                      ...SweetalertParams.info
                    })
                  }}
                  className='hover:cursor-pointer'
                >
                  {
                    props.enableSelect ? <CellSelect item={item as TableNode} /> : <></>
                  }
                  <Cell pinLeft>{item.id}</Cell>
                  <Cell>{item.chlo_a}</Cell>
                  <Cell>{item.fosfat}</Cell>
                  {
                    // has kelas
                    item.kelas ? (
                      <Cell>{item.kelas}</Cell>
                    ) : <></>
                  }
                  {
                    // has kelasPredict
                    item.kelasPredict ? (
                      <Cell>{item.kelasPredict}</Cell>
                    ) : <></>
                  }
                  {
                    // has distance
                    typeof item.distance !== 'undefined' ? (
                      <Cell>{item.distance}</Cell>
                    ) : <></>
                  }
                  <Cell hide>{Time.format(item.created_at)}</Cell>
                  <Cell hide>{Time.format(item.updated_at)}</Cell>
                </Row>
              ))}
            </Body>
          </>
        )}
      </Table>
    </div>
  )
}

export default DataTable