'use client'

import globalStyles from '@/app/global.module.css'
import { useStoreActions, useStoreState } from '@/state/hooks'
import DataRaw from '@/types/data-raw'
import { MiddlewareFunction } from '@table-library/react-table-library/types/common'
import { TableNode } from '@table-library/react-table-library/types/table'
import { SyntheticEvent, useEffect, useState } from 'react'
import { MdDownload, MdUpload } from 'react-icons/md'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
import styles from './data.module.css'
import DataTable from './datatable'
import Loading from './loading'
import Dropzone from 'react-dropzone'
import SweetalertParams from '@/variables/sweetalert2'
import readXlsxFile from 'read-excel-file'
import Client from './client'

const Form = (props: {
  onSubmit: (formValue: DataRaw.Select) => void
  defaultValue?: DataRaw.Select
}) => {
  const [formData, setFormData] = useState({
    chlo_a: props.defaultValue?.chlo_a,
    fosfat: props.defaultValue?.fosfat,
    kelas: props.defaultValue?.kelas
  })

  const handleSubmit = (e: SyntheticEvent) => {
    e.preventDefault()
    props.onSubmit({
      chlo_a: formData.chlo_a || 0,
      fosfat: formData.fosfat || 0,
      kelas: formData.kelas || ''
    })
  }

  return (
    <form className={styles.formContainer} onSubmit={handleSubmit}>
      <div>
        <label htmlFor={'chlo_a'} className={styles.inputLabel}>Chlo A</label>
        <input
          pattern="^\d*(\.\d{0,8})?$"
          required
          name={'chlo_a'}
          id={'chlo_a'}
          placeholder='Klorofil A...'
          className={styles.formInput}
          autoFocus
          defaultValue={props.defaultValue?.chlo_a}
          onChange={(e) => setFormData({ ...formData, chlo_a: Number(e.currentTarget.value) })}
        />
      </div>
      <div>
        <label htmlFor={'fosfat'} className={styles.inputLabel}>Fosfat</label>
        <input
          pattern="^\d*(\.\d{0,8})?$"
          required
          name={'fosfat'}
          id={'fosfat'}
          placeholder='Fosfat...'
          className={styles.formInput}
          defaultValue={props.defaultValue?.fosfat}
          onChange={(e) => setFormData({ ...formData, fosfat: Number(e.currentTarget.value) })}
        />
      </div>
      <div>
        <label htmlFor="kelas" className={styles.inputLabel}>Kelas</label>
        <select
          className={styles.formSelect}
          defaultValue={formData.kelas}
          onChange={(e) => setFormData({ ...formData, kelas: e.currentTarget.value })}
          required
        >
          <option value="" disabled selected hidden>Pilih Kelas...</option>
          <option value="Eutrofik">Eutrofik</option>
          <option value="Oligotrofik">Oligotrofik</option>
          <option value="Mesotrofik">Mesotrofik</option>
        </select>
      </div>
      <button
        className={styles.btnSubmit}
        type='submit'
      >
        Save
      </button>
    </form>
  )
}
const FormUpload = (props: {
  className?: string
}) => {
  const [files, setFiles] = useState<File[]>([])
  const [error, setError] = useState<string | null>(null)
  const { uploadData } = useStoreActions((actions) => actions)

  const ReactSwal = withReactContent(Swal)

  console.log(files)

  useEffect(() => {
    return () => {
      console.log('unmount')
      setFiles([])
    }
  }, [])

  const handleVerify = async () => {
    // read xlsx from files
    readXlsxFile(files[0]).then((rows) => {
      // read header
      const header = rows[0] as string[]

      // header must be chlo_a, fosfat, kelas. Store in array
      const errorMessages: string[] = []
      header.forEach((item, index) => {
        if (item !== 'chlo_a' && item !== 'fosfat' && item !== 'kelas') {
          errorMessages.push(`Header ${item} tidak sesuai`)
        }
      })

      // check data is empty or not
      if (rows.length < 2) {
        errorMessages.push('Data kosong')
      }

      // check data type, chlo_a and fosfat must be number, kelas must be string
      rows.slice(1).forEach((row, index) => {
        const chloA = row[0]
        const fosfat = row[1]

        // convert to float
        row[0] = Number.parseFloat(row[0].toString())
        row[1] = Number(row[1].toString())

        // check if chlo_a or fosfat is empty or NaN or null, and kelas is empty or null
        if (Number.isNaN(row[0])) {
          errorMessages.push(`Data "chlo_a" pada baris ${index + 2} salah format (isi: ${chloA})`)
        }
        if (Number.isNaN(row[1])) {
          errorMessages.push(`Data "fosfat" pada baris ${index + 2} salah format (isi: ${fosfat})`)
        }
        if (row[2] === '' || row[2] === null) {
          errorMessages.push(`Data "kelas" pada baris ${index + 2} kosong`)
        }


        if (typeof row[0] !== 'number') {
          errorMessages.push(`Data "chlo_a" pada baris ${index + 2} bukan angka (isi: ${chloA})`)
        }
        if (typeof row[1] !== 'number') {
          errorMessages.push(`Data "fosfat" pada baris ${index + 2} bukan angka (isi: ${fosfat})`)
        }
        if (typeof row[2] !== 'string') {
          errorMessages.push(`Data "kelas" pada baris ${index + 2} bukan string (isi: ${row[2]})`)
        }
        // check kelas value is must be Eutrofik, Oligotrofik, or Mesotrofik
        if (row[2] !== 'Eutrofik' && row[2] !== 'Oligotrofik' && row[2] !== 'Mesotrofik') {
          errorMessages.push(`Data "kelas" pada baris ${index + 2} tidak sesuai (isi: ${row[2]})`)
        }
      })

      console.log(errorMessages)

      if (errorMessages.length) {
        ReactSwal.update({
          ...SweetalertParams.error,
          title: 'Error',
          html: (
            <div className={styles.uploadVerifyContainer}>
              <div>
                {errorMessages.length ? errorMessages.map((item, index) => (
                  <p key={index}>{item}</p>
                )) : <></>}
              </div>
              <button
                type='button'
                className={styles.btnCancel}
                onClick={() => ReactSwal.close()}
              >
                  Cancel
              </button>
              <button
                type='button'
                className={styles.btnBack}
                onClick={() => {
                  ReactSwal.fire({
                    title: 'Upload Data',
                    html: (
                      <Client>
                        <FormUpload />,
                      </Client>
                    ),
                    customClass: {
                      popup: styles.popup
                    },
                    ...SweetalertParams.form
                  })
                }}
              >
                  Back
              </button>
            </div>
          ),
        })
        return
      } else {
        ReactSwal.fire({
          ...SweetalertParams.success,
          title: 'Verifikasi File Berhasil',
          showConfirmButton: false,
          html: (
            <div className={styles.uploadVerifyContainer}>
              <p>File dapat diupload</p>
              <button
                type='button'
                className={styles.btnCancel}
                onClick={() => ReactSwal.close()}
              >
                  Cancel
              </button>
              <button
                type='button'
                className={styles.btnSubmit}
                onClick={() => {
                  const data: DataRaw.Select[] = rows.slice(1).map((row) => ({
                    chlo_a: Number(row[0]),
                    fosfat: Number(row[1]),
                    kelas: row[2].toString()
                  }))

                  uploadData(data)
                }}
              >
                  Upload
              </button>
            </div>
          ),
        })
        return
      }
    })
  }

  return (
    <div className={styles.formUpload}>
      <span className='text-error font-black'>XLSX Only</span>
      <Dropzone
        accept={{
          // accept xlsx only
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
        }}
        onDrop={(acceptedFiles) => {
          setFiles(acceptedFiles)
        }}
        onDropAccepted={() => setError(null)}
        onDropRejected={(rejectedFiles) => {
          setError(rejectedFiles[0].errors.length ? 'File is not xlsx' : null)
          console.log('File is not xlsx')
        }}
      >
        {({ getRootProps, getInputProps }) => (
          <section>
            <div
              {...getRootProps()}
              className={
                styles.uploadArea +
                (error ? ` ${styles.error}` : '') +
                (files.length ? ` ${styles.success}` : '')
              }
              onDragOver={(e) => e.currentTarget.classList.add(styles.dragEnter)}
              onDragLeave={(e) => e.currentTarget.classList.remove(styles.dragEnter)}
            >
              <input
                {...getInputProps()}
                onDragEnter={(e) => e.currentTarget.classList.add(styles.dragEnter)}
                onDragLeave={(e) => e.currentTarget.classList.remove(styles.dragEnter)}
              />
              <button
                className={styles.btnUpload}
              >
                Upload
              </button>
              <p>Drag and drop some files here or click to select files</p>
              {
                files.length ? (
                  <p>{files[0].name}</p>
                ) : <></>
              }
              <p>{
                error ? (
                  <span className={styles.textError}>{error}</span>
                ) : <></>

              }</p>
            </div>
          </section>
        )}
      </Dropzone>
      <button
        className={styles.btnSubmit}
        disabled={!files.length}
        onClick={handleVerify}
      >
        Verify
      </button>
    </div>
  )
}

const Data = () => {
  const { getData, updateData, deleteData, storeData } = useStoreActions((actions) => actions)
  const { data, isLoading } = useStoreState((state) => state)
  const [ids, setIds] = useState<number[]>([])

  const ReactSwal = withReactContent(Swal)

  useEffect(() => {
    getData()
  }, [getData])

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
    console.log({ action, state })
    setIds(state.ids)
  }

  const handleEdit = () => {
    console.log(data[ids[0] - 1])
    ReactSwal.fire({
      title: 'Edit Data',
      html: <Form defaultValue={data[ids[0]]} onSubmit={async (formValue) => {
        updateData({ data: formValue, id: ids[0] })
      }} />,
      customClass: {
        popup: styles.popup
      },
      ...SweetalertParams.form
    })
  }

  const handleDelete = () => {
    ReactSwal.fire({
      title: 'Delete Data',
      text: 'Apakah anda yakin ingin menghapus data ini?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Hapus',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      customClass: {
        popup: styles.popup
      },
    }).then((result) => {
      if (result.isConfirmed) {
        deleteData({ ids })
      }
    })
  }

  const handleCreate = () => {
    ReactSwal.fire({
      title: 'Create Data',
      html: <Form onSubmit={async (formValue) => {
        storeData(formValue)
      }} />,
      customClass: {
        popup: styles.popup
      },
      ...SweetalertParams.form,
    })
  }

  const handleUpload = () => {
    ReactSwal.fire({
      title: 'Upload Data',
      html: (
        <Client>
          <FormUpload />,
        </Client>
      ),
      customClass: {
        popup: styles.popup
      },
      ...SweetalertParams.form
    })
  }

  return (
    <>
      <h1 className={globalStyles.title}>Data</h1>

      <div className={styles.actionGroup}>
        <div>
          <button
            type="button"
            className={styles.btnEdit + (ids.length === 1 ? '' : ' !hidden')}
            onClick={handleEdit}
          >
            Edit
          </button>
          <button
            type="button"
            className={styles.btnDelete + (ids.length ? '' : ' !hidden')}
            onClick={handleDelete}
          >
            Delete
          </button>
        </div>
        <div>
          <button
            className={styles.btnDownload}
            onClick={() => {
              // small swal
              ReactSwal.fire({
                title: 'Format Data',
                text: 'Apakah anda ingin mendownload format data?',
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'Ya',
                cancelButtonText: 'Tidak',
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                width: '30rem',
                reverseButtons: true,
                toast: true,
                customClass: {
                  popup: styles.popup
                },
              }).then((result) => {
                if (result.isConfirmed) {
                  const link = document.createElement('a')
                  link.href = '/format.xlsx'
                  link.download = 'format.xlsx'
                  link.click()
                }
              })
            }}
          >
            <MdDownload size={24} /> Format
          </button>
          <button
            type="button"
            className={styles.btnUpload}
            onClick={handleUpload}
          >
            <MdUpload size={24} />
          </button>
          <button
            type="button"
            className={styles.btnCreate}
            onClick={handleCreate}
          >
            Create
          </button>
        </div>
      </div>

      {
        !isLoading ? (
          data.length ? <DataTable
            tableData={{ nodes: data as TableNode[] }}
            onSelect={handleSelect as unknown as MiddlewareFunction}
            enableSelect
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

export default Data