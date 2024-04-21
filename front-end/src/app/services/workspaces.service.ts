import { Injectable } from '@angular/core';
import { IWorkspace, IWorkspaceBase } from '@core/types/workspaces';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class WorkspacesService {
    private readonly workspaces: IWorkspace[] = [];
    private readonly currentWorkspaceSubject: BehaviorSubject<IWorkspace> =
        new BehaviorSubject<IWorkspace>({
            model: {
                compartments: [],
                constants: [],
                interventions: [],
                flows: [],
            },
            name: '',
        });
    private readonly workspacesNamesSubject: BehaviorSubject<string[]> =
        new BehaviorSubject<string[]>([]);

    public readonly currentWorkspace$: Observable<IWorkspace> =
        this.currentWorkspaceSubject.asObservable();
    public readonly workspacesNames$: Observable<string[]> =
        this.workspacesNamesSubject.asObservable();

    public get currentWorkspace(): IWorkspace {
        return this.currentWorkspaceSubject.value;
    }
    public get workspacesNames(): string[] {
        return this.workspacesNamesSubject.value;
    }

    public addWorkspace(workspace: IWorkspaceBase): IWorkspace {
        const newWorkspace: IWorkspace = {
            name: `Workspace ${this.workspaces.length + 1}`,
            ...workspace,
        };

        if (this.workspaces.length === 0) {
            this.currentWorkspaceSubject.next(newWorkspace);
        }

        this.workspaces.push(newWorkspace);

        this.workspacesNamesSubject.next(this.getWorkspaceNames());

        return newWorkspace;
    }

    public updateWorkspace(workspace: IWorkspace): void {
        const workspaceIndex: number = this.workspaces.findIndex(
            (currentWorkspace: IWorkspace): boolean =>
                currentWorkspace.name === workspace.name
        );

        this.workspaces[workspaceIndex] = workspace;
    }

    public setCurrentWorkspace(workspaceName: string): void {
        const workspace: IWorkspace = this.workspaces.find(
            (workspace: IWorkspace): boolean => workspace.name === workspaceName
        ) as IWorkspace;

        this.currentWorkspaceSubject.next(workspace);
    }

    public removeWorkspace(workspaceName: string): void {
        const workspaceIndex: number = this.workspaces.findIndex(
            (workspace: IWorkspace): boolean => workspace.name === workspaceName
        );

        this.workspaces.splice(workspaceIndex, 1);

        this.updateWorkspaceNames();

        this.workspacesNamesSubject.next(this.getWorkspaceNames());

        if (this.currentWorkspace.name === workspaceName) {
            this.currentWorkspaceSubject.next(
                this.workspaces[Math.max(workspaceIndex - 1, 0)]
            );
        }
    }

    private getWorkspaceNames(): string[] {
        return this.workspaces.map(
            (workspace: IWorkspace): string => workspace.name
        );
    }

    private updateWorkspaceNames(): void {
        this.workspaces.forEach(
            (workspace: IWorkspace, index: number): void => {
                workspace.name = `Workspace ${index + 1}`;
            }
        );
    }
}
