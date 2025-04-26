from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, SubmitField, FloatField, IntegerField, SelectField, TextAreaField
from wtforms.validators import DataRequired, Email, EqualTo, ValidationError, Length, Optional, NumberRange, URL
from backend.models import User

class LoginForm(FlaskForm):
    username = StringField('Username', validators=[DataRequired()])
    password = PasswordField('Password', validators=[DataRequired()])
    submit = SubmitField('Sign In')

class RegistrationForm(FlaskForm):
    username = StringField('Username', validators=[DataRequired(), Length(min=3, max=64)])
    email = StringField('Email', validators=[DataRequired(), Email()])
    password = PasswordField('Password', validators=[DataRequired(), Length(min=8)])
    password2 = PasswordField('Repeat Password', validators=[DataRequired(), EqualTo('password')])
    submit = SubmitField('Register')
    
    def validate_username(self, username):
        from backend.models import get_session
        session = get_session()
        user = session.query(User).filter_by(username=username.data).first()
        session.close()
        if user is not None:
            raise ValidationError('Please use a different username.')
            
    def validate_email(self, email):
        from backend.models import get_session
        session = get_session()
        user = session.query(User).filter_by(email=email.data).first()
        session.close()
        if user is not None:
            raise ValidationError('Please use a different email address.')

class ProfileForm(FlaskForm):
    first_name = StringField('First Name', validators=[Optional(), Length(max=64)])
    last_name = StringField('Last Name', validators=[Optional(), Length(max=64)])
    height = FloatField('Height (cm)', validators=[Optional(), NumberRange(min=50, max=300)])
    weight = FloatField('Weight (kg)', validators=[Optional(), NumberRange(min=20, max=500)])
    age = IntegerField('Age', validators=[Optional(), NumberRange(min=12, max=120)])
    
    # New fields
    fitness_goals = TextAreaField('Fitness Goals', validators=[Optional(), Length(max=256)],
                               description="What are your fitness goals? (e.g., weight loss, muscle gain, endurance)")
    experience_level = SelectField('Experience Level', 
                                choices=[('', 'Select Level'), ('beginner', 'Beginner'), 
                                        ('intermediate', 'Intermediate'), ('advanced', 'Advanced')],
                                validators=[Optional()])
    preferred_workout_days = StringField('Preferred Workout Days', validators=[Optional(), Length(max=64)],
                                      description="Enter days separated by commas (e.g., Monday,Wednesday,Friday)")
    profile_picture_url = StringField('Profile Picture URL', validators=[Optional(), URL()],
                                   description="URL to your profile picture")
    
    submit = SubmitField('Update Profile') 