// create function that can download data as csv, define T as type of data
const downloadAsCSV = <T>(data: T[], filename: string) => {
  // get headers by getting keys of first data
  const headers = Object.keys(data[0] as Record<string, unknown>)
  const body = data.map((item) => {
    return headers.map((header) => {
      return (item as Record<string, unknown>)[header]
    })
  })

  // create csv
  let csv = `${headers.join(',')}\n`
  body.forEach((row) => {
    csv += `${row.join(',')}\n`
  })

  // create blob
  const blob = new Blob([csv], { type: 'text/csv' })
  
  // filename
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
}

export default downloadAsCSV