import moment from 'moment'

const Time = {
  format: (raw: string = moment().toISOString()) => {
    return moment(raw).format('YYYY-MM-DD HH:mm:ss')
  }
}

export default Time