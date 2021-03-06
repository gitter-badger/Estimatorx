﻿/// <reference path="../_ref.ts" />

module Estimatorx {
    "use strict";

    export class TemplateEditController {

        // protect for minification, must match contructor signiture.
        static $inject = [
            '$scope',
            '$location',
            '$modal',
            'logger',
            'modelFactory',
            'templateRepository',
            'organizationRepository'
        ];

        constructor(
            $scope,
            $location: ng.ILocationService,
            $modal: any,
            logger: Logger,
            modelFactory: ModelFactory,
            templateRepository: TemplateRepository,
            organizationRepository: OrganizationRepository
            ) {
            var self = this;

            // assign viewModel to controller
            $scope.viewModel = this;
            self.$scope = $scope;

            self.$location = $location;
            self.$modal = $modal;

            self.modelFactory = modelFactory;
            self.logger = logger;
            self.templateRepository = templateRepository;
            self.organizationRepository = organizationRepository;

            self.template = <ITemplate>{};

            // watch for navigation
            $(window).bind('beforeunload', () => {
                // prevent navigation by returning string
                if (self.isDirty())
                    return 'You have unsaved changes!';
            });

            self.init();
        }

        $scope: any;
        $location: ng.ILocationService;
        $modal: any;
        logger: Logger;
        modelFactory: ModelFactory;

        templateRepository: TemplateRepository;
        original: ITemplate;
        template: ITemplate;
        templateId: string;

        organizations: IOrganization[];
        organizationRepository: OrganizationRepository;

        init() {
            var self = this;

            self.organizationRepository.all()
                .success((data, status, headers, config) => {
                    self.organizations = data;
                })
                .error(self.logger.handelErrorProxy);
        }

        load(id?: string) {
            var self = this;

            self.templateId = id;

            // get template id
            if (!self.templateId) {
                self.template = self.modelFactory.createTemplate();
                return;
            }

            this.templateRepository.find(self.templateId)
                .success((data, status, headers, config) => {
                    self.loadDone(data);
                })
                .error((data, status, headers, config) => {
                    if (status == 404) {
                        self.template = self.modelFactory.createTemplate(self.templateId);
                        return;
                    }

                    self.logger.handelError(data, status, headers, config);
                });
        }

        loadDone(template: ITemplate) {
            var self = this;

            self.original = <IProject>angular.copy(template, {});
            self.template = template;

            self.setClean();
        }

        save(valid: boolean) {
            var self = this;

            if (!valid) {
                self.logger.showAlert({
                    type: 'error',
                    title: 'Validation Error',
                    message: 'A form field has a validation error. Please fix the error to continue.',
                    timeOut: 4000
                });

                return;
            }

            this.templateRepository.save(this.template)
                .success((data, status, headers, config) => {
                    self.loadDone(data);
                    self.logger.showAlert({
                        type: 'success',
                        title: 'Save Successful',
                        message: 'Template saved successfully.',
                        timeOut: 4000
                    });
                })
                .error(self.logger.handelErrorProxy);

        }

        undo() {
            var self = this;

            BootstrapDialog.confirm("Are you sure you want to undo changes?", (result) => {
                if (!result)
                    return;

                self.template = <ITemplate>angular.copy(self.original, {});

                self.setClean();

                self.$scope.$applyAsync();
            });
        }

        delete() {
            var self = this;

            BootstrapDialog.confirm("Are you sure you want to delete this template?",(result) => {
                if (!result)
                    return;

                this.templateRepository.delete(this.template.Id)
                    .success((data, status, headers, config) => {
                        self.logger.showAlert({
                            type: 'success',
                            title: 'Delete Successful',
                            message: 'Template deleted successfully.',
                            timeOut: 4000
                        });
                        
                        //redirect
                        window.location.href = 'Template';
                    })
                    .error(self.logger.handelErrorProxy);
            });

        }

        isDirty(): boolean {
            return this.$scope.templateForm.$dirty;
        }

        setDirty() {
            this.$scope.templateForm.$setDirty();
        }

        setClean() {
            this.$scope.templateForm.$setPristine();
            this.$scope.templateForm.$setUntouched();
        }


        addFactor() {
            if (!this.template.Factors)
                this.template.Factors = [];

            var factor = this.modelFactory.createFactor();
            this.template.Factors.push(factor);

            this.setDirty();
        }

        removeFactor(factor: IFactor) {
            if (!factor)
                return;

            var self = this;

            BootstrapDialog.confirm("Are you sure you want to remove this factor?", (result) => {
                if (!result)
                    return;

                for (var i = 0; i < self.template.Factors.length; i++) {
                    if (self.template.Factors[i].Id === factor.Id) {
                        self.template.Factors.splice(i, 1);
                        break;
                    }
                }

                self.setDirty();
                self.$scope.$apply();
            });
        }

        reorderFactors() {
            var self = this;

            var modalInstance = self.$modal.open({
                templateUrl: 'nameReorderModal.html',
                controller: 'reorderModalController',
                resolve: {
                    name: () => 'Factors',
                    items: () => self.template.Factors
                }
            });

            modalInstance.result.then((items: any[]) => {
                self.template.Factors = items;
                self.setDirty();
            });
        }


    }

    // register controller
    angular.module(Estimatorx.applicationName)
        .controller('templateEditController',
        [
            '$scope',
            '$location',
            '$modal',
            'logger',
            'modelFactory',
            'templateRepository',
            'organizationRepository',
            TemplateEditController
        ]
        );
}

