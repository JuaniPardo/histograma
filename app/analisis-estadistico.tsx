"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Line, ComposedChart } from 'recharts'
import { useTheme } from "next-themes"

export default function Component() {
    const [inputValues, setInputValues] = useState('')
    const [results, setResults] = useState(null)
    const [manualIntervals, setManualIntervals] = useState(false)
    const [intervalAdjustment, setIntervalAdjustment] = useState(0)
    const [roundUp, setRoundUp] = useState(false)
    const [intervalWidthAdjustment, setIntervalWidthAdjustment] = useState(0)
    const { theme, setTheme } = useTheme()

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

        const min = Math.min(...values)
        const max = Math.max(...values)
        const range = max - min
        const n = values.length

        const sturgesK = Math.ceil(1 + 3.322 * Math.log10(n))
        let k = manualIntervals ? Math.max(1, sturgesK + intervalAdjustment) : sturgesK

        let intervalWidth = range / k
        intervalWidth += intervalWidthAdjustment

        if (roundUp) {
            intervalWidth = Math.ceil(intervalWidth)
        }

        const intervals = []
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

    return (
        <div className="container mx-auto p-4 space-y-4">
            <div className="flex justify-end mb-4">
                <Switch
                    id="dark-mode"
                    checked={theme === 'dark'}
                    onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                />
                <Label htmlFor="dark-mode" className="ml-2 text-primary">Modo Oscuro</Label>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-primary">Análisis Estadístico Mejorado</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex space-x-2">
                            <Input
                                placeholder="Ingrese valores separados por comas"
                                value={inputValues}
                                onChange={(e) => setInputValues(e.target.value)}
                                className="border-primary"
                            />
                            <Button onClick={calculateStatistics} className="bg-primary text-primary-foreground hover:bg-primary/90">Calcular</Button>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="manual-intervals"
                                checked={manualIntervals}
                                onCheckedChange={setManualIntervals}
                            />
                            <Label htmlFor="manual-intervals" className="text-primary">Intervalos manuales</Label>
                        </div>
                        {manualIntervals && results && (
                            <div className="space-y-2">
                                <Label htmlFor="interval-adjustment" className="text-primary">Ajuste de intervalos</Label>
                                <Slider
                                    id="interval-adjustment"
                                    min={-5}
                                    max={5}
                                    step={1}
                                    value={[intervalAdjustment]}
                                    onValueChange={(value) => setIntervalAdjustment(value[0])}
                                    className="bg-primary"
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
                            <Label htmlFor="round-up" className="text-primary">Redondear hacia arriba</Label>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="interval-width-adjustment" className="text-primary">Ajuste de amplitud del intervalo</Label>
                            <Slider
                                id="interval-width-adjustment"
                                min={-5}
                                max={5}
                                step={0.1}
                                value={[intervalWidthAdjustment]}
                                onValueChange={(value) => setIntervalWidthAdjustment(value[0])}
                                className="bg-primary"
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
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-primary">Histograma y Frecuencia Relativa Acumulada</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={400}>
                                <ComposedChart data={results.intervals}>
                                    <XAxis dataKey="mark" tickFormatter={(value) => value.toFixed(2)} />
                                    <YAxis yAxisId="left" />
                                    <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} />
                                    <Tooltip
                                        labelFormatter={(value) => `Marca de clase: ${Number(value).toFixed(2)}`}
                                        formatter={(value, name) => {
                                            switch(name) {
                                                case "frequency":
                                                    return [value, "Frecuencia"];
                                                case "cumulativeRelativeFrequency":
                                                    return [`${(value * 100).toFixed(2)}%`, "Frecuencia Relativa Acumulada"];
                                                default:
                                                    return [value, name];
                                            }
                                        }}
                                    />
                                    <Bar dataKey="frequency" name="Frecuencia" fill="var(--primary)" yAxisId="left" />
                                    <Line type="monotone" dataKey="cumulativeRelativeFrequency" name="Frecuencia Relativa Acumulada" stroke="var(--secondary)" strokeWidth={2} yAxisId="right" />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-primary">Estadísticas Básicas</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableBody>
                                    <TableRow>
                                        <TableCell className="font-medium text-primary">Mínimo</TableCell>
                                        <TableCell>{results.min.toFixed(2)}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell className="font-medium text-primary">Máximo</TableCell>
                                        <TableCell>{results.max.toFixed(2)}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell className="font-medium text-primary">Rango</TableCell>
                                        <TableCell>{results.range.toFixed(2)}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell className="font-medium text-primary">Cantidad de muestras</TableCell>
                                        <TableCell>{results.n}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell className="font-medium text-primary">Número de intervalos</TableCell>
                                        <TableCell>{results.k}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell className="font-medium text-primary">Amplitud del intervalo</TableCell>
                                        <TableCell>{results.intervalWidth.toFixed(2)}</TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-primary">Tabla de Frecuencias</CardTitle>
                        </CardHeader>
                        <CardContent className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="text-primary">Intervalo</TableHead>
                                        <TableHead className="text-primary">Marca de Clase</TableHead>
                                        <TableHead className="text-primary">Frecuencia Absoluta</TableHead>
                                        <TableHead className="text-primary">Frecuencia Relativa</TableHead>
                                        <TableHead className="text-primary">Frecuencia Acumulada</TableHead>
                                        <TableHead className="text-primary">Frecuencia Relativa Acumulada</TableHead>
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
    )
}