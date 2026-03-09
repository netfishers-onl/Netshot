export type WithFilterBy<V extends object> = {
  filterBy?: (options: V[]) => V[]
}
