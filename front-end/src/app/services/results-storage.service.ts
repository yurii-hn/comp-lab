import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import {
    IExportResults,
    IResults,
    IResultsBase,
    OptimalControlResultsViewMode,
} from '../core/interfaces';
import { isOptimalControlResults } from '../core/utils';

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

    public addResults(results: IResultsBase): IResults {
        let newResults: IResults;

        if (isOptimalControlResults(results)) {
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

    private getWorkspaceNames(): string[] {
        return this.results.map((results: IResults): string => results.name);
    }

    private updateResultsNames(): void {
        this.results.forEach((results: IResults, index: number): void => {
            results.name = `Run ${index + 1}`;
        });
    }
}
