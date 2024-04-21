import { Injectable } from '@angular/core';
import {
    IExportResults,
    IExportSolution,
    IResults,
    IResultsBody,
    OptimalControlResultsViewMode,
    isOptimalControlResults,
    isOptimalControlResultsBody,
    isPIResults,
    isSimulationResults,
} from '@core/types/results';
import { BehaviorSubject, Observable } from 'rxjs';

const emptyResults: IResults = {
    data: {
        parameters: {
            time: 0,
            nodesAmount: 0,
        },
        payload: {
            compartments: [],
        },
    },
    name: '',
};

@Injectable({
    providedIn: 'root',
})
export class ResultsStorageService {
    private readonly results: IResults[] = [];
    private readonly currentResultSubject: BehaviorSubject<IResults> =
        new BehaviorSubject<IResults>(emptyResults);
    private readonly resultsNamesSubject: BehaviorSubject<string[]> =
        new BehaviorSubject<string[]>([]);

    public readonly currentResults$: Observable<IResults> =
        this.currentResultSubject.asObservable();
    public readonly resultsNames$: Observable<string[]> =
        this.resultsNamesSubject.asObservable();

    public get currentResults(): IResults {
        return this.currentResultSubject.value;
    }
    public get resultsNames(): string[] {
        return this.resultsNamesSubject.value;
    }

    public addResults(results: IResultsBody): IResults {
        let newResults: IResults;

        if (isOptimalControlResultsBody(results)) {
            newResults = {
                name: `Run ${this.results.length + 1}`,
                viewMode: OptimalControlResultsViewMode.Optimized,
                ...results,
            };
        } else {
            newResults = {
                name: `Run ${this.results.length + 1}`,
                ...results,
            };
        }

        if (this.results.length === 0) {
            this.currentResultSubject.next(newResults);
        }

        this.results.push(newResults);

        this.resultsNamesSubject.next(this.getWorkspaceNames());

        return newResults;
    }

    public setCurrentResults(resultsName: string): void {
        const results: IResults = this.results.find(
            (results: IResults): boolean => results.name === resultsName
        ) as IResults;

        this.currentResultSubject.next(results);
    }

    public removeResults(resultsName: string): void {
        const resultsIndex: number = this.results.findIndex(
            (results: IResults): boolean => results.name === resultsName
        );

        if (resultsIndex === -1) {
            return;
        }

        const isDeletingLastItem: boolean = this.results.length === 1;

        this.results.splice(resultsIndex, 1);

        this.updateResultsNames();

        this.resultsNamesSubject.next(this.getWorkspaceNames());

        if (isDeletingLastItem) {
            this.currentResultSubject.next(emptyResults);
            return;
        }

        if (this.currentResults.name === resultsName) {
            this.currentResultSubject.next(
                this.results[Math.max(resultsIndex - 1, 0)]
            );
        }
    }

    public getCurrentResultsExport(): IExportResults {
        return this.currentResults.data;
    }

    public getCurrentSolutionExport(): IExportSolution {
        if (isSimulationResults(this.currentResults)) {
            return this.currentResults.data.payload.compartments;
        } else if (isOptimalControlResults(this.currentResults)) {
            if (
                this.currentResults.viewMode ===
                OptimalControlResultsViewMode.NonOptimized
            ) {
                return this.currentResults.data.payload[0].compartments;
            }

            return [
                ...this.currentResults.data.payload[1].compartments,
                ...this.currentResults.data.payload[1].approximatedInterventions,
            ];
        } else if (isPIResults(this.currentResults.data)) {
            return this.currentResults.data.payload.approximatedSolution;
        }

        return [];
    }

    private getWorkspaceNames(): string[] {
        return this.results.map((results: IResults): string => results.name);
    }

    private updateResultsNames(): void {
        this.results.forEach((results: IResults, index: number): void => {
            results.name = `Run ${index + 1}`;
        });
    }
}
