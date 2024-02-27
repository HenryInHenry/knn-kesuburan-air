'use client'
import {
  CellSelect as CS,
  HeaderCellSelect,
  SelectClickTypes,
  SelectTypes,
  useRowSelect
} from '@table-library/react-table-library/select'
import {
  Body,
  Cell,
  Header,
  HeaderCell,
  HeaderRow,
  OnClick,
  Row,
  Table,
  TableNode
} from '@table-library/react-table-library/table'
import { useTheme } from '@table-library/react-table-library/theme'
import { MiddlewareFunction } from '@table-library/react-table-library/types/common'
import moment from 'moment'
import { HTMLAttributes, ReactNode, useEffect, useRef, useState } from 'react'
import { FaSort, FaSortDown, FaSortUp } from 'react-icons/fa'
import { MdChevronLeft, MdChevronRight } from 'react-icons/md'
import { useIntersectionObserver } from 'usehooks-ts'
import styles from './dataTable2.module.css'
import Select from './Select'
import { capitalize, findArrayDifferences, getURLWithoutQuery, setQueryParams } from '@/variables/helpers'
import useSwal from '@/hooks/Sweetalert'
import useAxios from '@/hooks/Axios'
import { AxiosError } from 'axios'
import { redirect, useRouter } from 'next/navigation'
import {
  CellTree,
  TreeExpandClickTypes,
  useTree
} from '@table-library/react-table-library/tree'

const CellSelect = (props: HTMLAttributes<HTMLElement> & {
  item: TableNode
}) => {
  return (
    <CS {...props}>{props.children}</CS>
  )
}


export type Column = {
  id: string,
  title: string,
  sort: boolean,
  width: string,
  hide?: boolean,
  type?: 'text' | 'date' | 'datetime'
}

export type DataType = {
  [key: string]: string | number | boolean | null | undefined | Date | ReactNode
}

type Props<T> = {
  data: T[],
  columns: Column[],
  enableSelect?: boolean,
  onSelectChange?: (selected: number[]) => void,
  onSearch?: (column: Column, value: string) => void
  perserveScroll?: boolean,
  rowClick?: {
    onClick?: OnClick<T & TableNode>,
    onDoubleClick?: OnClick<T & TableNode>,
  }
  lazy?: boolean,
  remainingData?: boolean,
  enableTree?: boolean
}

const DataTable2 = <T extends object>(props: Props<T>) => {
  const [lazyData, setLazyData] = useState<T[]>([])
  const [remainingData, setRemainingData] = useState(props.remainingData)

  if (!props.data.length) {
    return (
      <div className='flex justify-center items-center w-full h-full'>
        <p className='text-center text-gray-500'>No Data</p>
      </div>
    )
  }

  const data = {
    nodes: props.data.map((e, i) => ({ id: i + 1, ...e }))
  }
  const dataKeys = Object.keys(props.data[0]).filter(e => e != 'nodes' && e != 'isSelected')
  if (props.columns.length !== dataKeys.length) {
    console.error('Columns Length and Data Shape not same')
    console.error('Columns Length: ', props.columns.length)
    console.error('Data Shape: ', Object.keys(props.data[0]).length)
    console.error('Columns: ', props.columns)
    console.error('Data: ', props.data)
    // console.log(Object.keys(props.data[0]).filter(e => e != 'nodes'))
    const diff = findArrayDifferences(Object.keys(props.data[0]).filter(e => e != 'nodes'), props.columns.map(e => e.id))
    console.error('Diff: ', diff)

    return (
      <div>
        <p>Columns Length and Data Shape not same</p>
        <p>Columns Length: {props.columns.length}</p>
        <p>Data Shape: {Object.keys(props.data[0]).length}</p>
      </div>
    )
  }

  const columns = props.columns.filter(e => !e.hide)

  const onTreeChange: MiddlewareFunction = (action, state) => {

  }

  const tree = useTree(data, {
    onChange: onTreeChange
  }, {
    clickType: TreeExpandClickTypes.ButtonClick
  })

  const headerRowGridTC = columns.map((column) => {
    if (column.hide) return ''
    if (column.width.includes('-content')) {
      return column.width
    }
    return `minmax(${column.width}, 1fr)`
  }).join(' ')

  const theme = useTheme({
    Table: `
      --data-table-library_grid-template-columns: repeat(${props.enableSelect ? '2' : 1}, auto) ${props.enableTree ? 'repeat(1, auto)' : ''} ${headerRowGridTC} !important;
      border-radius: 0px !important;
    `,
    BaseCell: `
      background-color: transparent;
      padding: 2px 4px;
      &:first-of-type  {
        background-color: transparent !important;
      }
      &:first-of-type input {
        background-color: transparent !important;
        border-color: #6b7280 !important;
        box-shadow: none !important
      }
    `,
  })

  const onSelectChange: MiddlewareFunction = (_, state) => {
    props.onSelectChange?.(state.ids)
  }

  const select = useRowSelect(data, {
    onChange: onSelectChange,
  },
  {
    rowSelect: SelectTypes.MultiSelect,
    isPartialToAll: true,
    clickType: SelectClickTypes.ButtonClick,
  })

  const { Swal } = useSwal()
  const { axiosCsrf } = useAxios()



  const openSearch = (column: Column) => {
    const queryKeyValueArr = window.location.search.split('&').map(e => e.replace('?', '')).map(e => {
      const [key, value] = e.split('=')
      return { key, value }
    })
    console.log(queryKeyValueArr)
    const defaultValue = queryKeyValueArr.filter(e => e.key === column.id)[0]?.value || ''
    Swal({
      type: 'form',
      options: {
        title: `Search By ${column.title}`,
        input: 'text',
        inputPlaceholder: capitalize(column.title),
        showConfirmButton: true,
        inputAttributes: {
          required: '',
        },
        inputValue: defaultValue,
        validationMessage: 'This field is required',
      }
    }).then(({ isConfirmed, value }) => {
      if (isConfirmed && props.onSearch) props.onSearch(column, value)
    })
  }
  const direction = window.location.search.split('&').filter(e => e.includes('direction'))[0]?.split('=')[1]
  const sort = window.location.search.split('&').filter(e => e.includes('sort'))[0]?.split('=')[1]

  const isMobile = window.innerWidth <= 640

  const lazyRef = useRef<HTMLDivElement>(null)
  const entry = useIntersectionObserver(lazyRef, {})
  const isVisible = !!entry?.isIntersecting
  const handleLazyLoad = async () => {
    console.log('lazy load')

    // get page query param
    const URI = new URL(window.location.href)
    const page = URI.searchParams.get('page')
    console.log(page)

    const nextPage = parseInt(page || '1') + 1
    console.log(nextPage)


    const { data, remainingData } = await axiosCsrf(getURLWithoutQuery(), {
      headers: {
        'X-Page': nextPage.toString(),
      }
    })
      .then((res: { data: { data: T[]; remainingData: boolean } }) => {
        console.log(res.data)
        return {
          data: res.data.data as T[],
          remainingData: res.data.remainingData as boolean
        }
      })
      .catch((err: AxiosError) => {
        console.error(err)
        return {
          data: [] as T[],
          remainingData: false
        }
      })
    window.history.replaceState({}, '', setQueryParams({ page: nextPage.toString() }))

    setLazyData([...lazyData, ...data])
    setRemainingData(remainingData)
  }

  useEffect(() => {
    if (isVisible) {
      handleLazyLoad()
    }
  }, [isVisible])

  return (
    <>
      <Table
        data={data}
        tree={props.enableTree ? tree : undefined}
        theme={theme}
        select={select}
        layout={{ custom: true, horizontalScroll: true }}
      >
        {(tableList: TableNode[]) => {
          return (
            <>
              <Header>
                <HeaderRow>
                  {
                    props.enableSelect ? (
                      <HeaderCellSelect className={styles.headerCell} />
                    ) : <></>
                  }
                  {props.enableTree ? (
                    <HeaderCell className={styles.headerCell}>
                    </HeaderCell>
                  ) : <></>}
                  <HeaderCell className={styles.headerCell}>
                    No
                  </HeaderCell>
                  {columns.map((column) => (
                    <HeaderCell
                      key={column.id}
                      className={styles.headerCell + (props.onSearch ? ' hover:cursor-pointer' : '')}
                      onClick={() => {
                        // if (!isMobile && props.onSearch) openSearch(column)
                        if (props.onSearch) openSearch(column)
                      }}
                    // onDoubleClick={() => {
                    //   if (isMobile && props.onSearch) openSearch(column)
                    // }}
                    >
                      <span>{column.title}</span>
                      {column.sort && (
                        <div className={styles.sort}>
                          <button
                            className={styles.btnSort + (column.sort ? '' : ' hidden')}
                            onClick={(e) => {
                              e.stopPropagation()

                              const uri = new URL(window.location.href)
                              // get all query params except sort and direction
                              const queries = uri.searchParams.toString().split('&').filter(e => !e.includes('sort') && !e.includes('direction'))
                              // split query params into key value pair
                              const queriesKeyValueArr = queries.map(e => e.split('='))
                              // convert key value pair into object
                              const queriesKeyValueObj = Object.fromEntries(queriesKeyValueArr)
                              console.log(queriesKeyValueObj)

                              if (direction === 'asc') return redirect(window.location.pathname, {
                                ...queriesKeyValueObj,
                                sort: column.id,
                                direction: 'desc'
                              })
                              if (direction === 'desc') return redirect(window.location.pathname, queriesKeyValueObj)

                              redirect((typeof window === 'undefined') ? '/' : window.location.pathname, {
                                ...queriesKeyValueObj,
                                sort: column.id,
                                direction: 'asc',
                              })
                            }}
                          >
                            {column.id !== sort && !direction ? <FaSort size={14} /> : (
                              column.id === sort && direction === 'asc' ? <FaSortUp size={14} /> : (
                                column.id === sort && direction === 'desc' ? <FaSortDown size={14} /> : <FaSort size={14} />
                              )
                            )}
                          </button>
                        </div>
                      )}
                    </HeaderCell>
                  ))}
                </HeaderRow>
              </Header>
              <Body>
                {tableList.map((row) => {
                  return (
                    <Row
                      key={row.id}
                      item={row}
                      className={
                        styles.rowc + ' group' +
                        (props.rowClick ? ' hover:cursor-pointer select-none' : '')
                        // + (row['isSelected'] ? ' bg-base-200': '')
                      }
                      onDoubleClick={(node, e) => {
                        props.rowClick?.onDoubleClick?.(node as T & TableNode, e)
                      }}
                      onClick={(node, e) => {
                        props.rowClick?.onClick?.(node as T & TableNode, e)
                      }}
                    >
                      {
                        props.enableTree ? (
                          <CellTree
                            item={row}
                          >
                          </CellTree>
                        ) : <></>
                      }
                      {
                        props.enableSelect ? (
                          <CellSelect
                            item={row}
                            className={styles.cell + ' group-hover:!bg-base-200 group-active:!bg-base-300'}
                          />
                        ) : <></>
                      }
                      <Cell className={styles.cell + ' group-hover:!bg-base-200 group-active:!bg-base-300'}>
                        {row.id}
                      </Cell>
                      {
                        columns.map((key) => (
                          <Cell
                            key={key.id}
                            className={
                              styles.cell
                              + ' group-hover:!bg-base-200 group-active:!bg-base-300'
                              + (row['isSelected'] ? ' !bg-base-300' : '')
                            }
                          >
                            {key.type === 'date'
                              ? moment(row[key.id] as never).format('D MMMM YYYY')
                              : (key.type === 'datetime'
                                ? moment(row[key.id] as never).format('D MMMM YYYY HH:mm')
                                : row[key.id])}
                            {/* {
                              (['created_at', 'updated_at'].includes(key.id) && row[key.id])
                                ? moment(row[key.id]).format('YYYY-MM-DD HH:mm:ss') :
                                (row[key.id] || '-')
                            } */}
                            {/* {isValidDate(row[key.id]) ? moment(row[key.id]).format('YYYY-MM-DD HH:mm:ss') : row[key.id]} */}
                          </Cell>
                        ))
                      }
                    </Row>
                  )
                })}
                {
                  (props.lazy && lazyData.length > 0) ? (
                    lazyData.map((row, i) => {
                      return (
                        <Row
                          key={i}
                          item={{ id: props.data.length + i + 1 }}
                        >
                          {
                            props.enableSelect ? (
                              <CellSelect
                                item={{ id: props.data.length + i + 1 }}
                                className={styles.cell + ' group-hover:!bg-base-200 group-active:!bg-base-300'}
                              />
                            ) : <></>
                          }
                          <Cell className={styles.cell + ' group-hover:!bg-base-200 group-active:!bg-base-300'}>
                            {props.data.length + i + 1}
                          </Cell>
                          {
                            columns.map((key) => (
                              <Cell
                                key={key.id}
                                className={styles.cell + ' group-hover:!bg-base-200 group-active:!bg-base-300'}
                              >
                                {key.type === 'date' ? moment(row[key.id as never] as never).format('D MMMM YYYY') : row[key.id as never]}
                                {/* {
                                  (['created_at', 'updated_at'].includes(key.id) && row[key.id])
                                    ? moment(row[key.id]).format('YYYY-MM-DD HH:mm:ss') :
                                    (row[key.id] || '-')
                                } */}
                                {/* {isValidDate(row[key.id]) ? moment(row[key.id]).format('YYYY-MM-DD HH:mm:ss') : row[key.id]} */}
                              </Cell>
                            ))
                          }
                        </Row>
                      )
                    })
                  ) : <></>
                }
                {
                  (props.lazy && remainingData) ? (
                    <Row
                      item={{ id: props.data.length + 1 }}
                    >
                      <Cell
                        colSpan={columns.length + (props.enableSelect ? 2 : 1)}
                        className={styles.loading}
                      >
                        <div
                          ref={lazyRef}
                          className='h-full'
                        >
                          {Array.from({ length: 5 }).map((_, i) => (
                            <div
                              key={i}
                              className='skeleton h-6 w-full mb-1'
                            />
                          ))}
                        </div>
                      </Cell>
                    </Row>
                  ) : <></>
                }
              </Body>
            </>
          )
        }}
      </Table>


    </>
  )
}

export default DataTable2