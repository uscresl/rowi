

var config = {
    plugins: [
        {
            type: 'clickposition',
        },
        {
            type: 'record_services',
            namespace: 'robot'
        },
        {
            type: 'video',
            namespace: 'robot'
        },
        {
            type: 'dynamic_reconfigure',
        },
        {
            type: 'diagnostic_gui',
        },
        {
            type: 'plot',
        },
        {
            type: 'web_video',
        },
    ]
};
