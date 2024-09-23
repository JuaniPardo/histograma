"use client"

import {useState, useEffect} from 'react'
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table"
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card"
import {Slider} from "@/components/ui/slider"
import {Switch} from "@/components/ui/switch"
import {Label} from "@/components/ui/label"
import {Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Line, ComposedChart} from 'recharts'
import {useTheme} from "next-themes"

export default function AnalisisEstadistico() {
    interface Interval {
        start: number
        end: number
        frequency: number
        relativeFrequency: number
        cumulativeFrequency: number
        cumulativeRelativeFrequency: number
        mark: number
    }

    interface Results {
        min: number
        max: number
        range: number
        n: number
        k: number
        intervalWidth: number
        intervals: Interval[]
        sturgesK: number
    }

    const [inputValues, setInputValues] = useState('')
    const [results, setResults] = useState<Results | null>(null)
    const [manualIntervals, setManualIntervals] = useState(false)
    const [intervalAdjustment, setIntervalAdjustment] = useState(0)
    const [roundUp, setRoundUp] = useState(false)
    const [intervalWidthAdjustment, setIntervalWidthAdjustment] = useState(0)
    const {theme, setTheme} = useTheme()

    useEffect(() => {
        setTheme('dark')
    }, [])

    useEffect(() => {
        if (results) {
            calculateStatistics()
        }
    }, [manualIntervals, intervalAdjustment, roundUp, intervalWidthAdjustment])

    const calculateStatistics = () => {
        const values = inputValues.split(',').map(Number).filter(n => !isNaN(n))
        if (values.length === 0) return

        const min: number = Math.min(...values)
        const max: number = Math.max(...values)
        const range: number = max - min
        const n: number = values.length

        const sturgesK: number = Math.ceil(1 + 3.322 * Math.log10(n))
        const k: number = manualIntervals ? Math.max(1, sturgesK + intervalAdjustment) : sturgesK

        let intervalWidth = range / k
        intervalWidth += intervalWidthAdjustment

        if (roundUp) {
            intervalWidth = Math.ceil(intervalWidth)
        }

        const intervals: Interval[] = []
        for (let i = 0; i < k; i++) {
            const start = min + i * intervalWidth
            let end = min + (i + 1) * intervalWidth

            if (i === k - 1) {
                end = Math.max(end, max + 0.1)
            }

            intervals.push({
                start,
                end,
                frequency: 0,
                relativeFrequency: 0,
                cumulativeFrequency: 0,
                cumulativeRelativeFrequency: 0,
                mark: (start + end) / 2
            })
        }

        values.forEach(value => {
            const index = intervals.findIndex(interval => value >= interval.start && value < interval.end)
            if (index !== -1) {
                intervals[index].frequency++
            }
        })

        let cumulativeFrequency = 0
        intervals.forEach(interval => {
            interval.relativeFrequency = interval.frequency / n
            cumulativeFrequency += interval.frequency
            interval.cumulativeFrequency = cumulativeFrequency
            interval.cumulativeRelativeFrequency = cumulativeFrequency / n
        })

        setResults({
            min,
            max,
            range,
            n,
            k,
            intervalWidth,
            intervals,
            sturgesK
        })
    }

    const getPrimaryColor = () => theme === 'dark' ? '#00c5c5' : '#ff69b4'
    const getSecondaryColor = () => theme === 'dark' ? '#ff69b4' : '#00c5c5'

    return (
        <div className="container mx-auto p-4 space-y-4 min-h-fitn">
            <div className="flex justify-end mb-4">
                <Switch
                    id="dark-mode"
                    checked={theme === 'dark'}
                    onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                />
                <Label htmlFor="dark-mode" className="ml-2 text-primary-light dark:text-primary-dark">Modo
                    Oscuro</Label>
            </div>
            <h1 className="text-center pb-3 text-4xl font-bold text-primary-light dark:text-primary-dark">Análisis
                Estadístico <span
                    className="text-muted-foreground font-normal">DaVinci 2024</span></h1>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-5">

                {/* Input Data Card */}
                <Card className="col-span-1 md:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-primary-light dark:text-primary-dark">Entrada de Datos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex space-x-2">
                                <Input
                                    placeholder="Ingrese valores separados por comas"
                                    value={inputValues}
                                    onChange={(e) => setInputValues(e.target.value)}
                                    className="border-primary-light dark:border-primary-dark"
                                />
                                <Button
                                    onClick={calculateStatistics}
                                    className="text-primary text-black hover:bg-primary-light/90 dark:bg-primary-dark dark:text-foreground-dark dark:hover:bg-primary-dark/90"
                                >
                                    Calcular
                                </Button>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="manual-intervals"
                                    checked={manualIntervals}
                                    onCheckedChange={setManualIntervals}
                                />
                                <Label htmlFor="manual-intervals" className="text-primary-light dark:text-primary-dark">Ajustar
                                    intervalos</Label>
                            </div>
                            {manualIntervals && results && (
                                <div className="space-y-2">
                                    <Label htmlFor="interval-adjustment"
                                           className="text-primary-light dark:text-primary-dark">Ajuste de
                                        intervalos</Label>
                                    <Slider
                                        id="interval-adjustment"
                                        min={-5}
                                        max={5}
                                        step={1}
                                        value={[intervalAdjustment]}
                                        onValueChange={(value) => setIntervalAdjustment(value[0])}
                                        className="bg-primary-light dark:bg-primary-dark"
                                    />
                                    <div className="text-sm text-muted-foreground">
                                        Intervalos: {results.sturgesK + intervalAdjustment}
                                    </div>
                                </div>
                            )}
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="round-up"
                                    checked={roundUp}
                                    onCheckedChange={setRoundUp}
                                />
                                <Label htmlFor="round-up" className="text-primary-light dark:text-primary-dark">Redondear
                                    hacia arriba</Label>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="interval-width-adjustment"
                                       className="text-primary-light dark:text-primary-dark">Ajuste de amplitud del
                                    intervalo</Label>
                                <Slider
                                    id="interval-width-adjustment"
                                    min={-5}
                                    max={5}
                                    step={0.1}
                                    value={[intervalWidthAdjustment]}
                                    onValueChange={(value) => setIntervalWidthAdjustment(value[0])}
                                    className="bg-primary-light dark:bg-primary-dark"
                                />
                                <div className="text-sm text-muted-foreground">
                                    Ajuste: {intervalWidthAdjustment.toFixed(1)}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {results && (
                    <>
                        {/* Histogram Card */}
                        <Card className="col-span-1 md:col-span-3">
                            <CardHeader>
                                <CardTitle className="text-primary-light dark:text-primary-dark">Histograma y Frecuencia
                                    Relativa Acumulada</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={400}>
                                    <ComposedChart data={results.intervals}>
                                        <XAxis dataKey="mark" tickFormatter={(value) => value.toFixed(2)}/>
                                        <YAxis yAxisId="left"/>
                                        <YAxis yAxisId="right" orientation="right"
                                               tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}/>
                                        <Tooltip
                                            labelFormatter={(value) => `Marca de clase: ${Number(value).toFixed(2)}`}
                                            formatter={(value:number, name:string) => {
                                                switch (name) {
                                                    case "frequency":
                                                        return [value, "Frecuencia"];
                                                    case "cumulativeRelativeFrequency":
                                                        return [`${(value * 100).toFixed(2)}%`, "Frecuencia Relativa Acumulada"];
                                                    default:
                                                        return [value, name];
                                                }
                                            }}
                                            contentStyle={{
                                                backgroundColor: theme === 'dark' ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                                                border: `1px solid ${theme === 'dark' ? '#ffffff' : '#000000'}`,
                                                borderRadius: '4px',
                                                padding: '10px',
                                            }}
                                            labelStyle={{
                                                color: theme === 'dark' ? '#ffffff' : '#000000',
                                                fontWeight: 'bold',
                                                marginBottom: '5px',
                                            }}
                                            itemStyle={{
                                                color: theme === 'dark' ? '#ffffff' : '#000000',
                                            }}
                                        />
                                        <Bar dataKey="frequency" name="Frecuencia" fill={getPrimaryColor()}
                                             yAxisId="left"/>
                                        <Line type="monotone" dataKey="cumulativeRelativeFrequency"
                                              name="Frecuencia Relativa Acumulada" stroke={getSecondaryColor()}
                                              strokeWidth={3} yAxisId="right"/>
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Basic Statistics Card */}
                        <Card className="col-span-1 md:col-span-1">
                            <CardHeader>
                                <CardTitle className="text-primary-light dark:text-primary-dark">Estadísticas
                                    Básicas</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableBody>
                                        <TableRow>
                                            <TableCell
                                                className="font-medium text-primary-light dark:text-primary-dark">Mínimo</TableCell>
                                            <TableCell>{results.min.toFixed(2)}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell
                                                className="font-medium text-primary-light dark:text-primary-dark">Máximo</TableCell>
                                            <TableCell>{results.max.toFixed(2)}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell
                                                className="font-medium text-primary-light dark:text-primary-dark">Rango</TableCell>
                                            <TableCell>{results.range.toFixed(2)}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell
                                                className="font-medium text-primary-light dark:text-primary-dark">Cantidad
                                                de muestras</TableCell>
                                            <TableCell>{results.n}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell
                                                className="font-medium text-primary-light dark:text-primary-dark">Número
                                                de intervalos</TableCell>
                                            <TableCell>{results.k}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell
                                                className="font-medium text-primary-light dark:text-primary-dark">Amplitud
                                                del intervalo</TableCell>
                                            <TableCell>{results.intervalWidth.toFixed(2)}</TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>

                        {/* Frequency Table Card */}
                        <Card className="col-span-1 md:col-span-4">
                            <CardHeader>
                                <CardTitle className="text-primary-light dark:text-primary-dark">Tabla de
                                    Frecuencias</CardTitle>
                            </CardHeader>
                            <CardContent className="overflow-x-auto">
                                <Table className="text-primary-light dark:text-primary-dark">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead
                                                className="text-primary-light dark:text-primary-dark">Intervalo</TableHead>
                                            <TableHead className="text-primary-light dark:text-primary-dark">
                                                Marca de Clase
                                            </TableHead>
                                            <TableHead className="text-primary-light dark:text-primary-dark">
                                                Frecuencia Absoluta
                                            </TableHead>
                                            <TableHead className="text-primary-light dark:text-primary-dark">
                                                Frecuencia Relativa
                                            </TableHead>
                                            <TableHead className="text-primary-light dark:text-primary-dark">
                                                Frecuencia Acumulada
                                            </TableHead>
                                            <TableHead className="text-primary-light dark:text-primary-dark">
                                                Frecuencia Rel. Ac.
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {results.intervals.map((interval, index) => (
                                            <TableRow key={index}>
                                                <TableCell>{`[${interval.start.toFixed(2)}, ${interval.end.toFixed(2)}${index === results.intervals.length - 1 ? ']' : ')'}`}</TableCell>
                                                <TableCell>{interval.mark.toFixed(2)}</TableCell>
                                                <TableCell>{interval.frequency}</TableCell>
                                                <TableCell>{(interval.relativeFrequency * 100).toFixed(2)}%</TableCell>
                                                <TableCell>{interval.cumulativeFrequency}</TableCell>
                                                <TableCell>{(interval.cumulativeRelativeFrequency * 100).toFixed(2)}%</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>


                    </>
                )}
            </div>
            {/* Footer. Float to the bottom of the page. */}
            <hr/>
            <div className="text-center text-sm text-muted-foreground mt-auto pt-4 backdrop-blur-xl">
                Esta APP fue desarrollada por <a href="https://github.com/JuaniPardo" target="_blank" rel="noreferrer"
                                                 className="text-primary font-bold">Juan Ignacio Pardo</a> y <a
                href="https://v0.dev/chat" target="_blank" rel="noreferrer" className="text-secondary font-bold">v0</a>.
            </div>


        </div>
    )
}