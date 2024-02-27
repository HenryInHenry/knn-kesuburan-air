import _ from 'lodash'

type Feature = number[]
export type Label = 'Eutrofik' | 'Oligotrofik' | 'Mesotrofik'

export type KNNReturnType = {
  predictions: {
    label: Label
    distance: number
    distances: { label: Label, distance: number }[]
  }[]
}

export type ConfusionMatrix = {
  TP?: number
  TN?: number
  FP?: number
  FN?: number
  accuracy?: number
  precision?: number
  recall?: number
  f1Score?: number
}

class KNN {
  private k: number
  private features?: Feature[]
  private labels?: Label[]
  private distanceBetweenData?: {
    id: string | number
    item: Feature;
    label: Label;
    item2: Feature;
    label2: Label;
    distance: number;
  }[][]
  private validities?: {
    data: Feature[];
    validity: number;
    dataSortedByDistance: {
      id: string | number,
      data: Feature,
      distance: number,
      label: Label,
      validity: number
    }[]
  }[]
  private weights?: {
    id: string | number
    item: Feature;
    label: Label;
    item2: Feature;
    label2: Label;
    distance: number;
    weight: number;
  }[][]
  private weightTests?: {
    id: string | number
    item: Feature;
    item2: Feature;
    label2: Label;
    weight: number;
  }[][]
  private sortedWeightTest?: {
    id: string | number
    item: Feature;
    item2: Feature;
    label2: Label;
    weight: number;
  }[][]

  constructor(k: number) {
    // k is must odd
    if (k % 2 === 0) {
      throw new Error('k must be odd')
    }
    this.k = k
  }

  public weighted = {
    train: (data: Feature[], labels: Label[]) => {
      this.features = data
      this.labels = labels

      // 1
      this.distanceBetweenData = data.map((item, idx) => {
        return data.map((item2, idx2) => ({
          id: `${idx+1}-${idx2+1}`,
          item,
          label: labels[idx],
          item2,
          label2: labels[idx2],
          distance: this.distance(item, item2)
        }))
      })
      // console.log(this.distanceBetweenData)

      // 2
      this.validities = this.distanceBetweenData.map(item => {
        const dataSortedByDistance = _.orderBy(item, 'distance', 'asc')
        return {
          data,
          validity: dataSortedByDistance
            .filter(a => a.distance !== 0)
            .slice(0, this.k)
            .map(item => item.label === item.label2 ? 1 : 0 as number)
            .reduce((acc, curr) => acc + curr, 0) / this.k,
          dataSortedByDistance: dataSortedByDistance
            .filter(a => a.distance !== 0)
            .slice(0, this.k)
            .map(item => ({
              id: item.id,
              data: item.item2,
              label: item.label2,
              distance: item.distance,
              validity: item.label === item.label2 ? 1 : 0 as number
            }))
        }
      })
      // console.log(this.validities)

      // 3
      this.weights = this.distanceBetweenData.map(item => {
        return item.map((item2, idx2) => ({
          weight: this.validities![idx2].validity / (item2.distance + 0.5),
          ...item2,
        }))
      })
      // console.log(this.weights)
    },
    predict: (data: Feature[]) => {
      if (!this.weights) throw new Error('Please call `weighted.train` before `predict`.')

      this.weightTests = data.map((item, idx) => {
        return this.features!.map((item2, idx2) => ({
          id: `${idx+1}-${idx2+1}`,
          item,
          item2,
          label2: this.labels![idx2],
          weight: this.validities![idx2].validity / (this.distance(item, item2) + 0.5)
        }))
      })
      // console.log(this.weightTests)

      // order weight voting descending
      this.sortedWeightTest = this.weightTests.map((items, idx) => {
        return _.orderBy(items, 'weight', 'desc')
      })
      // console.log(this.sortedWeightTest)

      // get predicted label
      const labels = this.sortedWeightTest.map((items, idx) => ({
        // item:  items[idx].item,
        weights: items.map(item => ({
          id: item.id,
          data: item.item2,
          label: item.label2,
          weight: item.weight
        })),
        label: this.majorityVote(items.map(item =>
          item.label2).slice(0, this.k))
      }))
      // console.log(labels)

      return labels
    }
  }

  public getDistanceBetweenData() {
    return this.distanceBetweenData
  }
  public getValidites() {
    return this.validities
  }
  public getWeights() {
    return this.weights
  }
  public getWeightTests() {
    return this.weightTests
  }

  public getK(): number {
    return this.k
  }

  public setK(k: number): void {
    this.k = k
  }

  // set training data
  public train(features: Feature[], labels: Label[]): void {
    if (features.length !== labels.length) {
      throw new Error('features and labels must have the same length')
    }

    this.features = features
    this.labels = labels
  }

  // calculate euclidean distance
  private distance(a: Feature, b: Feature): number {
    const [x1, y1] = a
    const [x2, y2] = b

    return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2))
  }

  // majority vote
  public majorityVote(labels: Label[]): Label {
    const votes = labels.reduce((acc, label) => {
      if (!acc[label]) {
        acc[label] = 0
      }

      acc[label] += 1

      return acc
    }, {} as Record<Label, number>)

    const sortedVotes = Object.entries(votes).sort((a, b) => b[1] - a[1])

    return sortedVotes[0][0] as Label
  }

  // predict label
  public predict(data: Feature[]): KNNReturnType {
    if (!this.features || !this.labels) {
      throw new Error('train the model first')
    }

    const predictions = data.map((feature) => {
      const distances = this.features!.map((f) => this.distance(feature, f))
      const sortedDistances = distances.map((distance, index) => ({
        distance,
        label: this.labels![index],
      })).sort((a, b) => a.distance - b.distance)

      const kNearestLabels = sortedDistances.slice(0, this.k).map((d) => d.label)

      return {
        label: this.majorityVote(kNearestLabels),
        distance: sortedDistances[0].distance,
        distances: sortedDistances,
      }
    })

    // console.log(predictions)

    return { predictions }
  }


  public weightedPredict(data: Feature[], actual: Label[]) {
    if (!this.features || !this.labels) {
      throw new Error('train the model first')
    }
    // console.log({ data, actual })
    if (data.length !== actual.length) {
      throw new Error('data and labels must have same length')
    }

    const predictions = data.map((item, idx1) => {
      // validity
      const distances = this.features!.map((f) => this.distance(item, f))
      const sortedDistances = distances.map((distance, idx2) => ({
        distance,
        label: this.labels![idx2],
        similarity: actual[idx1] === this.labels![idx2] ? 1 : 0,
        actual: actual[idx1],
      })).sort((a, b) => a.distance - b.distance)
      const validity = _.sumBy(sortedDistances, 'similarity') / this.k
    })
  }

  // calculate accuracy using confusion matrix
  public confusionMatrix(predictions: Label[], labels: Label[]): ConfusionMatrix {
    if (predictions.length !== labels.length) {
      throw new Error('predictions and labels must have the same length')
    }

    // true positive
    const tp = predictions.reduce((acc, prediction, index) => {
      if (prediction === labels[index]) {
        acc += 1
      }

      return acc
    }, 0)

    // true negative
    const tn = predictions.reduce((acc, prediction, index) => {
      if (prediction !== labels[index]) {
        acc += 1
      }

      return acc
    }, 0)

    // false positive
    const fp = predictions.reduce((acc, prediction, index) => {
      if (prediction !== labels[index]) {
        acc += 1
      }

      return acc
    }, 0)

    // false negative
    const fn = predictions.reduce((acc, prediction, index) => {
      if (prediction !== labels[index]) {
        acc += 1
      }

      return acc
    }, 0)

    const accuracy = (tp + tn) / (tp + tn + fp + fn)
    const precision = tp / (tp + fp)
    const recall = tp / (tp + fn)
    const f1Score = 2 * (precision * recall) / (precision + recall)

    return {
      accuracy,
      precision,
      recall,
      f1Score,
      TP: tp,
      TN: tn,
      FP: fp,
      FN: fn,
    }
  }
}

export default KNN