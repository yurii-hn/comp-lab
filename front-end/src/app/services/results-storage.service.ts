import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import {
    IResults,
    IResultsBase
} from '../core/interfaces';

@Injectable({
    providedIn: 'root',
})
export class ResultsStorageService {
    private readonly results: IResults[] = [];
    private readonly currentResultSubject: BehaviorSubject<IResults> =
        new BehaviorSubject<IResults>({
            data: {
                time: 0,
                step: 0,
                compartments: [],
                interventions: [],
                success: true,
            },
            name: '',
        });
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
        const newResults: IResults = {
            name: `Run ${this.results.length + 1}`,
            ...results,
        };

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

        this.results.splice(resultsIndex, 1);

        this.updateResultsNames();

        this.resultsNamesSubject.next(this.getWorkspaceNames());

        if (this.currentResults.name === resultsName) {
            this.currentResultSubject.next(
                this.results[Math.max(resultsIndex - 1, 0)]
            );
        }
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
