import apiFactory from "inject!infrastructure/api";
import packagesResponse from "../data/packagesResponse";
import hostsResponse from "../data/hostsResponse";

describe( "API", () => {
	let dependencies, halonStubs, jQueryAdapter, api, actions, errorLog;

	beforeEach( () => {
		errorLog = sinon.stub( console, "error" );
		halonStubs = {
			followResourceLink: sinon.stub(),
			package: {
				list: sinon.stub().resolves( packagesResponse )
			},
			host: {
				list: sinon.stub().resolves( hostsResponse )
			},
			connect: sinon.spy( () => {
				return {
					catch: sinon.stub().callsArgWith( 0, "connect error" )
				};
			} )
		};

		jQueryAdapter = sinon.stub();

		dependencies = {
			halon: sinon.stub().returns( halonStubs ),
			"stores/configurationStore": {
				getChanges: sinon.stub()
			},
			jquery: {
				ajaxSetup: sinon.stub()
			}
		};

		dependencies.halon.jQueryAdapter = jQueryAdapter;

		actions = {
			pageInitialized: sinon.stub(),
			loadProjectsSuccess: sinon.stub(),
			loadProjectsError: sinon.stub(),
			loadHostsSuccess: sinon.stub(),
			loadHostsError: sinon.stub()
		};

		lux.customActionCreator( actions );

		api = apiFactory( dependencies );
	} );

	afterEach( () => {
		errorLog.restore();
		Object.keys( lux.actions ).forEach( key => delete lux.actions[ key ] );
		api.luxCleanup();
	} );

	it( "should initialize halon", () => {
		dependencies.halon.should.be.calledOnce;
		jQueryAdapter.should.be.calledOnce.and.calledWith( dependencies.jquery );
		halonStubs.connect.should.be.calledOnce;
	} );

	describe( "when handling initializePage", () => {
		it( "should call the package list endpoint and then the hosts list", ( done ) => {
			lux.customActionCreator( {
				loadProjectsSuccess() {
					halonStubs.package.list.should.be.calledOnce;
					halonStubs.host.list.should.not.be.called;
				},
				loadHostsSuccess() {
					halonStubs.package.list.should.be.calledOnce;
					done();
				}
			} );

			lux.publishAction( "initializePage" );
		} );
	} );

	it( "should handle errors while initializing halon", () => {
		errorLog.should.be.calledOnce.and.calledWith( "connect error" );
		dependencies.halon.should.be.calledOnce;
		jQueryAdapter.should.be.calledOnce.and.calledWith( dependencies.jquery );
		halonStubs.connect.should.be.calledOnce;
	} );

	describe( "when handling loadProjects", () => {
		describe( "with successful response", () => {
			it( "should invoke package list resource", () => {
				lux.publishAction( "loadProjects" );
				halonStubs.package.list.should.be.calledOnce;
			} );
			it( "should publish loadProjectsSuccess action", ( done ) => {
				lux.customActionCreator( {
					loadProjectsSuccess( data ) {
						data.should.eql( packagesResponse );
						done();
					}
				} );
				lux.publishAction( "loadProjects" );
			} );
		} );
		describe( "with failed response", () => {
			it( "should publish loadProjectsError action", ( done ) => {
				halonStubs.package.list = sinon.stub().rejects( new Error( "OHSNAP" ) );
				lux.customActionCreator( {
					loadProjectsError( err ) {
						err.message.should.eql( "OHSNAP" );
						done();
					}
				} );
				lux.publishAction( "loadProjects" );
			} );
		} );
	} );

	describe( "when handling loadHosts", () => {
		describe( "with successful response", () => {
			it( "should invoke host list resource", () => {
				lux.publishAction( "loadHosts" );
				halonStubs.host.list.should.be.calledOnce;
			} );
			it( "should publish loadHostsSuccess action", ( done ) => {
				lux.customActionCreator( {
					loadHostsSuccess( data ) {
						data.should.eql( hostsResponse );
						done();
					}
				} );
				lux.publishAction( "loadHosts" );
			} );
		} );
		describe( "with failed response", () => {
			it( "should publish loadHostsError action", ( done ) => {
				halonStubs.host.list = sinon.stub().rejects( new Error( "OHSNAP" ) );
				lux.customActionCreator( {
					loadHostsError( err ) {
						err.message.should.eql( "OHSNAP" );
						done();
					}
				} );
				lux.publishAction( "loadHosts" );
			} );
		} );
	} );
} );
